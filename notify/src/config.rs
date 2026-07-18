use std::env;

/// Modo de validação do JWT de admin.
#[derive(Clone, PartialEq)]
pub enum AuthMode {
    /// Valida chamando a API do Supabase (`/auth/v1/user`) — igual ao backend
    /// Express; funciona com qualquer método de assinatura (HS256 ou assimétrico).
    Supabase,
    /// Valida localmente com HS256 + JWT_SECRET (dev/testes com tokens próprios).
    Hs256,
}

/// Configuração carregada do ambiente (.env / variáveis do processo).
#[derive(Clone)]
pub struct Config {
    /// Conexão Postgres (mesmo banco do Supabase).
    pub database_url: String,
    pub auth_mode: AuthMode,
    /// Segredo HS256 (usado só no modo Hs256).
    pub jwt_secret: String,
    /// URL do Supabase (usado no modo Supabase para validar tokens).
    pub supabase_url: String,
    /// Chave publishable/anon do Supabase (header `apikey` na validação).
    pub supabase_key: String,
    /// Segredo compartilhado que o backend usa em POST /events (RN13).
    pub ingest_secret: String,
    pub port: u16,
    pub cors_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let database_url = require("DATABASE_URL")?;
        let auth_mode = match env::var("NOTIFY_AUTH_MODE").as_deref() {
            Ok("hs256") => AuthMode::Hs256,
            _ => AuthMode::Supabase,
        };
        let jwt_secret = env::var("JWT_SECRET").unwrap_or_default();
        let supabase_url = env::var("SUPABASE_URL")
            .or_else(|_| env::var("PUBLIC_SUPABASE_URL"))
            .unwrap_or_default();
        let supabase_key = env::var("PUBLIC_SUPABASE_PUBLISHABLE_KEY")
            .or_else(|_| env::var("SUPABASE_ANON_KEY"))
            .unwrap_or_default();

        if auth_mode == AuthMode::Supabase && (supabase_url.is_empty() || supabase_key.is_empty()) {
            anyhow::bail!(
                "modo Supabase exige SUPABASE_URL/PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_PUBLISHABLE_KEY"
            );
        }
        if auth_mode == AuthMode::Hs256 && jwt_secret.is_empty() {
            anyhow::bail!("modo hs256 exige JWT_SECRET");
        }

        let ingest_secret =
            env::var("NOTIFY_INGEST_SECRET").unwrap_or_else(|_| "dev-ingest-secret".to_string());
        let port = env::var("NOTIFY_PORT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3100);
        let cors_origins = env::var("NOTIFY_CORS_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:5173,http://localhost:5174".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Ok(Self {
            database_url,
            auth_mode,
            jwt_secret,
            supabase_url,
            supabase_key,
            ingest_secret,
            port,
            cors_origins,
        })
    }
}

fn require(key: &str) -> anyhow::Result<String> {
    env::var(key).map_err(|_| anyhow::anyhow!("variável de ambiente obrigatória ausente: {key}"))
}
