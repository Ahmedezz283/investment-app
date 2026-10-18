import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Gorule } from "./gorules.entity.js";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ZenEngine } from "@gorules/zen-engine";
import path from "path";
import { promises as fs } from 'fs';

export type GoRulesContext = Record<string, any>;

@Injectable()
export class GoRulesService {
  private readonly engine: ZenEngine;
  private readonly rulesDir = path.join(process.cwd(), 'rules');

  constructor(
    @InjectRepository(Gorule)
    private readonly repo: Repository<Gorule>,
  ) {
    this.engine = new ZenEngine({
      loader: async (key: string) => {
        const rule = await this.repo.findOne({ where: { name: key } });
        //console.log(`${key}`)
        if (!rule) {
          throw new Error(`Imported policy '${key}' not found in database.`);
        }
        return Buffer.from(JSON.stringify(rule.content), "utf8");
      }
    });
  }

  findAll(): Promise<GoRulesContext[]> {
    return this.repo.find();
  }

  async uploadFromFiles(
    name: string,
    ruleFileBuffer: Buffer,
    dictionaryFileBuffer: Buffer,
  ): Promise<Gorule> {
    let content: Record<string, any>;
    let dictionary: Record<string, any>;

    try {
      content = JSON.parse(ruleFileBuffer.toString('utf8'));
    } catch {
      throw new BadRequestException('ruleFile must contain valid JSON');
    }

    try {
      dictionary = JSON.parse(dictionaryFileBuffer.toString('utf8'));
    } catch {
      throw new BadRequestException('dictionaryFile must contain valid JSON');
    }

    this.removeDictionary(content);

    const ruleDir = path.join(this.rulesDir, name);
    await fs.mkdir(ruleDir, { recursive: true });

    await Promise.all([
      fs.writeFile(
        path.join(ruleDir, 'rule.json'),
        JSON.stringify(content, null, 2),
        'utf8',
      ),
      fs.writeFile(
        path.join(ruleDir, 'dictionary.json'),
        JSON.stringify(dictionary, null, 2),
        'utf8',
      ),
    ]);

    let rule = await this.repo.findOne({ where: { name } });
    if (rule) {
      rule.content = content;
    } else {
      rule = this.repo.create({ name, content });
    }

    return this.repo.save(rule);
  }


  async evaluate(name: string, context: Record<string, any>) {
    const ruleDir = path.join(this.rulesDir, name);
    const rulePath = path.join(ruleDir, 'rule.json');
    let content: Record<string, any>;

    try {
      const fileContent = await fs.readFile(rulePath, 'utf8');
      content = JSON.parse(fileContent);
    } catch (err) {
      throw new NotFoundException(
        `Rule '${name}' not found on disk (expected at ${rulePath})`,
      );
    }

    const decision = this.engine.createDecision(content);
    const response = await decision.evaluate(context);

    return response.result;

    // //find in db
    // const rule = await this.repo.findOne({ where: { name } });
    // if (!rule) throw new NotFoundException(`Rule '${name}' not found`);

    // const decisiondb = this.engine.createDecision(rule.content);
    // //console.log(rule.content)
    // const responsedb = await decisiondb.evaluate(context);
    // return responsedb.result;
  }

  private removeDictionary(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key === '\$dictionary') delete obj[key];
      else this.removeDictionary(obj[key]);
    }
  }
}
