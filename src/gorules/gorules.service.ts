import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GoRulesValue = string | number | boolean | null;
export type GoRulesContext = Record<string, GoRulesValue>;

@Injectable()
export class GoRulesService {
  constructor(private readonly configService: ConfigService) { }

  async evaluate(context: GoRulesContext): Promise<GoRulesContext> {
    const evaluateUrl = this.configService.get<string>('GORULES_API_URL');
    const authorization = this.configService.get<string>('GORULES_AUTH');
    const authHeader =
      this.configService.get<string>('GORULES_AUTH_HEADER') ?? 'X-API-KEY';

    if (!evaluateUrl) {
      throw new BadGatewayException(
        'GoRules configuration is incomplete. Set GORULES_API_URL.',
      );
    }

    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (authorization) {
      headers.set(authHeader, authorization);
    }
    console.log('GoRules request debug:', {
      url: evaluateUrl,
      authHeader,
      authorization,
    });

    let response: Response;
    try {
      response = await fetch(
        evaluateUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ context }),
        },
      );
    } catch {
      throw new BadGatewayException('Unable to connect to GoRules');
    }

    if (!response.ok) {
      const message = await response.text();
      throw new BadGatewayException(
        `GoRules request failed (${response.status}): ${message || response.statusText}`,
      );
    }

    const payload = (await response.json()) as unknown;
    return this.extractResult(payload);
  }

  private extractResult(payload: unknown): GoRulesContext {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadGatewayException('GoRules returned an invalid response');
    }

    const body = payload as Record<string, unknown>;
    const result = body.result ?? body.output ?? body.data ?? body;
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new BadGatewayException('GoRules returned no decision result');
    }

    return result as GoRulesContext;
  }
}
