import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Gorule } from "./gorules.entity.js";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ZenEngine } from "@gorules/zen-engine";

export type GoRulesContext = Record<string, any>;

@Injectable()
export class GoRulesService {
  private readonly engine: ZenEngine;

  constructor(
    @InjectRepository(Gorule)
    private readonly repo: Repository<Gorule>,
  ) {
    this.engine = new ZenEngine({
      loader: async (key: string) => {
        const rule = await this.repo.findOne({ where: { name: key } });
        if (!rule) {
          throw new Error(`Imported policy '${key}' not found in database.`);
        }
        return Buffer.from(JSON.stringify(rule.content), "utf8");
      }
    });
  }

  async uploadFromFile(name: string, fileBuffer: Buffer): Promise<Gorule> {
    let content: Record<string, any>;
    try {
      content = JSON.parse(fileBuffer.toString('utf8'));
    } catch {
      throw new BadRequestException('File must contain valid JSON');
    }

    this.removeDictionary(content);

    let rule = await this.repo.findOne({ where: { name } });
    if (rule) {
      rule.content = content;
    } else {
      rule = this.repo.create({ name, content });
    }
    return this.repo.save(rule);
  }

  async evaluate(name: string, context: Record<string, any>) {
    const rule = await this.repo.findOne({ where: { name } });
    if (!rule) throw new NotFoundException(`Rule '${name}' not found`);

    const decision = this.engine.createDecision(rule.content);
    const response = await decision.evaluate(context);
    return response.result;
  }

  private removeDictionary(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key === '\$dictionary') delete obj[key];
      else this.removeDictionary(obj[key]);
    }
  }
}
