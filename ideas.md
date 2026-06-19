# Only Fangs — Design Ideas

## Três Abordagens Estilísticas

### 1. Necromantica Bauhaus
Geometria severa encontra o oculto. Tipografia blocada, grid assimétrico, vermelho sangue como único acento cromático sobre preto absoluto.
**Probabilidade:** 0.07

### 2. Velvet Underground Gothic ← ESCOLHIDA
Luxo sombrio e decadente. Texturas de veludo, dourado envelhecido, tipografia serifada elegante. A plataforma parece um salão secreto do século XIX onde criadores vendem suas almas artísticas.
**Probabilidade:** 0.09

### 3. Cyberpunk Obscuro
Neon violeta e ciano sobre preto, estética de terminal, fontes monospace. Dark mas futurista.
**Probabilidade: 0.04**

---

## Abordagem Escolhida: Velvet Underground Gothic

### Design Movement
**Victorian Occult Luxury** — A estética de salões secretos do século XIX, grimórios encadernados em couro, e arte simbolista francesa. Pensa em Aubrey Beardsley encontrando a interface de uma plataforma de criadores moderna.

### Core Principles
1. **Escuridão como luxo** — Preto não é ausência, é presença. Cada elemento existe no escuro com propósito.
2. **Dourado como hierarquia** — O ouro indica exclusividade, tiers premium, e conteúdo desbloqueado.
3. **Tipografia como ritual** — Cinzel para títulos (gravado em pedra), Cormorant para corpo (manuscrito à pena).
4. **Assimetria deliberada** — Layouts que quebram a simetria para criar tensão visual e mistério.

### Color Philosophy
- `#040204` — Preto absoluto (fundo base, vazio primordial)
- `#0e0b0e` — Mármore escuro (cards, superfícies elevadas)
- `#160810` — Veludo (hover states, seções destacadas)
- `#c8a44a` — Ouro envelhecido (CTAs, destaques, tier premium)
- `#e6c870` — Ouro claro (hover do ouro, texto em destaque)
- `#861624` — Carmesim (tier criador, ações críticas)
- `#a81828` — Sangue (hover do carmesim)
- `#efe6d4` — Marfim (texto principal)
- `#d0bfa0` — Pálido (texto secundário)
- `#877060` — Névoa (texto terciário, placeholders)
- `#3a2830` — Fumaça (bordas sutis)

### Layout Paradigm
- **Navegação lateral esquerda** para o dashboard do criador (inspirado no Patreon)
- **Grid masonry** para galerias de imagens (inspirado no Pinterest dark)
- **Lista vertical com player inline** para música (inspirado no Bandcamp)
- **Cards com blur backdrop** para conteúdo bloqueado por tier
- **Hero assimétrico** com texto à esquerda e imagem do criador à direita

### Signature Elements
1. **Ornamentos de linha dourada** — Separadores decorativos `✦` com linhas que se dissolvem
2. **Grain/noise texture** — Sobreposição sutil de ruído para textura analógica
3. **Arcos góticos** — Elementos de borda com forma de arco pontudo em cards premium

### Interaction Philosophy
- Hover revela conteúdo gradualmente (como abrir um grimório)
- Conteúdo bloqueado aparece com blur e overlay de "desbloqueie com tier X"
- Player de música com visualizador de onda sutil
- Transições de página com fade escuro (como apagar velas)

### Animation
- `fadeUp`: 0.8s ease-out para entradas de seção
- `grain`: animação de ruído para textura de fundo
- `floatUp`: partículas douradas flutuando no hero
- Hover em cards: `translateY(-4px)` + borda dourada aparece
- Player: barra de progresso com cor de sangue

### Typography System
- **Display/Títulos:** `Cinzel` — gravado, majestoso, romano
- **Corpo/Narrativo:** `Cormorant Garamond` — serifado elegante, levemente condensado
- **Citações/Subtítulos:** `IM Fell English` — itálico, manuscrito histórico
- **Hierarquia:** 9px/11px para tags e labels em Cinzel uppercase; 18px para corpo; clamp(32px, 5vw, 72px) para títulos

### Brand Essence
**Only Fangs** — A plataforma para criadores da escuridão, onde o conteúdo exclusivo é um ritual, não uma transação.
Personalidade: **Misterioso · Exclusivo · Visceral**

### Brand Voice
- Headlines: "Abra o Grimório" / "Entre no Círculo" / "Desbloqueie o Ritual"
- CTAs: "Assinar o Pacto" / "Entrar no Coven" / "Revelar Conteúdo"
- Microcopy: "Apenas para iniciados" / "Conteúdo sagrado" / "Acesso eterno"

### Wordmark & Logo
Símbolo: Dois caninos estilizados formando um "V" invertido com uma gota de sangue no centro. Sem texto no ícone.

### Signature Brand Color
`#c8a44a` — Ouro Envelhecido — inconfundivelmente Only Fangs.
