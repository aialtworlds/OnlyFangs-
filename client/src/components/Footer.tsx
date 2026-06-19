// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Footer Component
// ═══════════════════════════════════════════════════════════

export default function Footer() {
  const year = new Date().getFullYear();

  const links = {
    Plataforma: ['Descobrir', 'Criadores', 'Categorias', 'Planos'],
    Criadores: ['Aplicar', 'Como Funciona', 'Taxas & Pagamentos', 'Recursos'],
    Suporte: ['Central de Ajuda', 'Diretrizes', 'Privacidade', 'Termos'],
  };

  return (
    <footer
      style={{
        background: 'oklch(0.04 0.008 285)',
        borderTop: '1px solid oklch(0.72 0.09 75 / 10%)',
        padding: '80px 0 40px',
      }}
    >
      <div className="container">
        <div
          style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '64px',
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '0.2em',
                color: 'oklch(0.72 0.09 75)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/logo-icon-GS2XhBKAJ7cguv6fE9nSDv.png"
                alt="Only Fangs"
                style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'invert(1) sepia(1) saturate(2) hue-rotate(10deg)' }}
              />
              ONLY
              <span style={{ color: 'oklch(0.93 0.02 80)', fontWeight: 400 }}>FANGS</span>
            </div>
            <p
              style={{
                fontFamily: "'IM Fell English', serif",
                fontStyle: 'italic',
                fontSize: '15px',
                color: 'oklch(0.55 0.03 60)',
                lineHeight: 1.8,
                maxWidth: '280px',
                marginBottom: '24px',
              }}
            >
              A plataforma para criadores da escuridão. Onde o conteúdo exclusivo é um ritual, não uma transação.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Instagram', 'Twitter', 'Discord'].map((social) => (
                <button
                  key={social}
                  onClick={() => {}}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '8px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'oklch(0.55 0.03 60)',
                    background: 'none',
                    border: '1px solid oklch(1 0 0 / 10%)',
                    padding: '7px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.color = 'oklch(0.72 0.09 75)';
                    el.style.borderColor = 'oklch(0.72 0.09 75 / 30%)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.color = 'oklch(0.55 0.03 60)';
                    el.style.borderColor = 'oklch(1 0 0 / 10%)';
                  }}
                >
                  {social}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.72 0.09 75)',
                  marginBottom: '20px',
                }}
              >
                {category}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => {}}
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '15px',
                        color: 'oklch(0.55 0.03 60)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.color = 'oklch(0.82 0.03 75)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.color = 'oklch(0.55 0.03 60)';
                      }}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid oklch(1 0 0 / 6%)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '9px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'oklch(0.35 0.02 60)',
            }}
          >
            © {year} Only Fangs · Todos os direitos reservados
          </p>
          <p
            style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: 'italic',
              fontSize: '13px',
              color: 'oklch(0.35 0.02 60)',
            }}
          >
            <span style={{ color: 'oklch(0.72 0.09 75 / 60%)' }}>✦</span>{' '}
            Onde a imortalidade encontra a exclusividade{' '}
            <span style={{ color: 'oklch(0.72 0.09 75 / 60%)' }}>✦</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
