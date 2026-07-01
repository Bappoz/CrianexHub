import React, {useState} from 'react';

interface Props {
  email: string;
  password: string;
}

/* Credenciais de avaliação do professor. A senha nasce com blur (estado
   "privado") e só é revelada em texto claro sob ação explícita do usuário
   (clique no ícone de olho) — evita expor a senha em capturas de tela casuais
   da página aberta em apresentação. */
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-3.19 4.19M6.61 6.61A13.16 13.16 0 0 0 1 12s4 7 11 7a10.43 10.43 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function AccessCredentials({email, password}: Props): React.ReactElement {
  const [revealed, setRevealed] = useState(false);

  return (
    <p style={{margin: '0.5rem 0 0'}}>
      <strong>E-mail:</strong> <code>{email}</code> · <strong>Senha:</strong>{' '}
      <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', verticalAlign: 'middle'}}>
        <code
          style={{
            filter: revealed ? 'none' : 'blur(5px)',
            userSelect: revealed ? 'text' : 'none',
            transition: 'filter 0.15s ease',
          }}
        >
          {password}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
          title={revealed ? 'Ocultar senha' : 'Mostrar senha'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'inline-flex',
            color: 'var(--ifm-color-emphasis-600)',
            lineHeight: 0,
          }}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </p>
  );
}
