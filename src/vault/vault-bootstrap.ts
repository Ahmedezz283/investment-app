import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(process.cwd(), '.env') });
export async function loadSecretsFromVault(): Promise<void> {
    const addr = process.env.VAULT_ADDR;
    const roleId = process.env.VAULT_ROLE_ID;
    const secretId = process.env.VAULT_SECRET_ID;
    const mount = process.env.VAULT_MOUNT ?? 'kv';
    const secretPath = process.env.VAULT_SECRET_PATH ?? 'investment-app';

    if (!addr || !roleId || !secretId) {
        throw new Error(
            'Missing required Vault bootstrap variables: VAULT_ADDR, VAULT_ROLE_ID, VAULT_SECRET_ID',
        );
    }

    const loginUrl = `${addr}/v1/auth/approle/login`;
    const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role_id: roleId,
            secret_id: secretId,
        }),
    });

    if (!loginRes.ok) {
        const body = await loginRes.text();
        throw new Error(`Vault AppRole login failed (${loginRes.status}): ${body}`);
    }

    const loginJson = (await loginRes.json()) as {
        auth?: { client_token?: string };
    };
    const clientToken = loginJson.auth?.client_token;
    if (!clientToken) {
        throw new Error('AppRole login response did not contain a client_token');
    }

    const secretUrl = `${addr}/v1/${mount}/data/${secretPath}`;
    const secretRes = await fetch(secretUrl, {
        method: 'GET',
        headers: {
            'X-Vault-Token': clientToken,
        },
    });

    if (!secretRes.ok) {
        const body = await secretRes.text();
        throw new Error(`Vault secret read failed (${secretRes.status}): ${body}`);
    }

    const secretJson = (await secretRes.json()) as {
        data?: { data?: Record<string, unknown> };
    };
    const data = secretJson.data?.data;
    if (!data || typeof data !== 'object') {
        throw new Error(`No secret data found at ${mount}/data/${secretPath}`);
    }

    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
            process.env[key] = String(value);
        }
    }

    console.log(`✅ Loaded ${Object.keys(data).length} secrets from Vault`);

    try {
        const revokeUrl = `${addr}/v1/auth/token/revoke-self`;
        await fetch(revokeUrl, {
            method: 'POST',
            headers: {
                'X-Vault-Token': clientToken,
            },
        });
        console.log('🔒 Temporary Vault token revoked');
    } catch (revokeErr) {
        console.warn('Could not revoke token (non-fatal):', revokeErr);
    }
}