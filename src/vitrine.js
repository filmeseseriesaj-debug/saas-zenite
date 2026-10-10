import { supabase } from './supabase.js';

let lojaAtual = null;
let produtosCatalogo = [];
let produtoSendoCustomizado = null;
let acrescimoTamanho = 0;
let tamanhoSelecionado = 'P';
let descontoCupom = 0;

// Recuperação segura do LocalStorage (F5 não apaga o pedido)
let carrinho = JSON.parse(localStorage.getItem('zenite_carrinho') || '[]');

// DOM Elements
const modalCarrinho = document.getElementById('modal-carrinho');
const modalCustomizacao = document.getElementById('modal-customizacao');
const btnTopoSacola = document.getElementById('btn-topo-sacola');
const btnAbrirSacola = document.getElementById('btn-abrir-sacola');
const btnFecharCarrinho = document.getElementById('btn-fechar-carrinho');
const btnFecharCustom = document.getElementById('btn-fechar-custom');
const containerItensCarrinho = document.getElementById('carrinho-itens');
const barraCheckout = document.getElementById('barra-checkout-fixa');
const barraQtd = document.getElementById('barra-qtd');
const barraTotal = document.getElementById('barra-total');
const badgeSacola = document.getElementById('badge-sacola');
const carrinhoSubtotal = document.getElementById('carrinho-subtotal');
const btnEnviarPedido = document.getElementById('btn-enviar-pedido');
const tipoEntregaSelect = document.getElementById('cli-tipo-entrega');
const campoEndereco = document.getElementById('campo-endereco');
const inputBusca = document.getElementById('input-busca');
const listaProdutos = document.getElementById('lista-produtos');
const crossSellContainer = document.getElementById('cross-sell-itens');
const bannerSlides = document.getElementById('banner-slides');
const bannerDots = document.getElementById('banner-dots');

const cliNome = document.getElementById('cli-nome');
const cliWhats = document.getElementById('cli-whats');
const cliEndereco = document.getElementById('cli-endereco');

cliNome.value = localStorage.getItem('zenite_cli_nome') || '';
cliWhats.value = localStorage.getItem('zenite_cli_whats') || '';
cliEndereco.value = localStorage.getItem('zenite_cli_endereco') || '';

// Banners Clicáveis (Promoções & Produtos em Destaque)
const bannersDelivery = [
  {
    titulo: 'Smash Burger Artesanal',
    subtitulo: 'Combo especial com batata e refrigerante',
    badge: '🔥 20% OFF HOJE',
    preco: 'R$ 29,90',
    imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    acao: () => {
      if (produtosCatalogo.length > 0) {
        window.abrirCustomizacao(produtosCatalogo[0].id);
      }
    }
  },
  {
    titulo: 'Pizza Quatro Queijos',
    subtitulo: 'Massa fermentada 48h com borda recheada',
    badge: '⭐ MAIS PEDIDA',
    preco: 'R$ 49,90',
    imagem: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    acao: () => {
      const tabPizza = document.querySelector('[data-cat="Pizzas"]');
      if (tabPizza) tabPizza.click();
      listaProdutos?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  {
    titulo: 'Bebidas Geladas & Sobremesas',
    subtitulo: 'Complete seu pedido com adicionais refrescantes',
    badge: '🥤 ADICIONE JÁ',
    preco: 'A partir de R$ 6,00',
    imagem: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    acao: () => {
      const tabBebidas = document.querySelector('[data-cat="Bebidas"]');
      if (tabBebidas) tabBebidas.click();
      listaProdutos?.scrollIntoView({ behavior: 'smooth' });
    }
  }
];

let slideAtual = 0;

function montarBannersDelivery() {
  if (!bannerSlides) return;
  bannerSlides.innerHTML = '';
  bannerDots.innerHTML = '';

  bannersDelivery.forEach((b, idx) => {
    const slide = document.createElement('div');
    slide.className = 'w-full h-full relative flex-shrink-0 cursor-pointer overflow-hidden';
    slide.innerHTML = `
      <img src="${b.imagem}" class="w-full h-full object-cover" alt="${b.titulo}" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-4">
        <span class="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider mb-1">${b.badge}</span>
        <h3 class="text-white font-extrabold text-base leading-tight">${b.titulo}</h3>
        <p class="text-slate-300 text-[11px] font-medium line-clamp-1">${b.subtitulo}</p>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-white font-black text-sm">${b.preco}</span>
          <span class="bg-primaria text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm">
            Pedir Agora ➔
          </span>
        </div>
      </div>
    `;

    slide.onclick = b.acao;
    bannerSlides.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = idx === 0 ? 'w-2.5 h-1.5 rounded-full bg-white transition-all' : 'w-1.5 h-1.5 rounded-full bg-white/40 transition-all';
    bannerDots.appendChild(dot);
  });
}

setInterval(() => {
  slideAtual = (slideAtual + 1) % bannersDelivery.length;
  if (bannerSlides) bannerSlides.style.transform = `translateX(-${slideAtual * 100}%)`;

  const dots = bannerDots?.querySelectorAll('div');
  dots?.forEach((d, idx) => {
    d.className = idx === slideAtual ? 'w-2.5 h-1.5 rounded-full bg-white transition-all' : 'w-1.5 h-1.5 rounded-full bg-white/40 transition-all';
  });
}, 4000);

function persistirCarrinho() {
  localStorage.setItem('zenite_carrinho', JSON.stringify(carrinho));
  atualizarInterfaceCarrinho();
}

tipoEntregaSelect.addEventListener('change', (e) => {
  campoEndereco.classList.toggle('hidden', e.target.value === 'Retirada');
});

btnTopoSacola.addEventListener('click', () => { modalCarrinho.classList.remove('hidden'); renderizarCarrinho(); });
btnAbrirSacola.addEventListener('click', () => { modalCarrinho.classList.remove('hidden'); renderizarCarrinho(); });
btnFecharCarrinho.addEventListener('click', () => modalCarrinho.classList.add('hidden'));
btnFecharCustom.addEventListener('click', () => modalCustomizacao.classList.add('hidden'));

// ABRIR CUSTOMIZAÇÃO DE PRODUTO
window.abrirCustomizacao = function(id) {
  const prod = produtosCatalogo.find(p => p.id === id);
  if (!prod) return;

  produtoSendoCustomizado = prod;
  acrescimoTamanho = 0;
  tamanhoSelecionado = 'P';

  document.getElementById('modal-prod-nome').innerText = prod.nome;
  document.getElementById('modal-prod-base').innerText = `A partir de R$ ${Number(prod.preco).toFixed(2).replace('.', ',')}`;
  document.getElementById('obs-item').value = '';

  document.querySelectorAll('.chk-adicional').forEach(c => c.checked = false);
  document.querySelectorAll('.opt-tamanho').forEach((b, idx) => {
    b.className = idx === 0 
      ? 'opt-tamanho p-2 rounded-xl border text-center border-primaria bg-primaria text-white' 
      : 'opt-tamanho p-2 rounded-xl border text-center border-slate-200 bg-slate-50 text-slate-700';
  });

  recalcularValorCustomizacao();
  modalCustomizacao.classList.remove('hidden');
};

document.querySelectorAll('.opt-tamanho').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.opt-tamanho').forEach(b => {
      b.className = 'opt-tamanho p-2 rounded-xl border text-center border-slate-200 bg-slate-50 text-slate-700';
    });
    btn.className = 'opt-tamanho p-2 rounded-xl border text-center border-primaria bg-primaria text-white';
    tamanhoSelecionado = btn.dataset.tam;
    acrescimoTamanho = Number(btn.dataset.adic || 0);
    recalcularValorCustomizacao();
  });
});

document.querySelectorAll('.chk-adicional').forEach(chk => {
  chk.addEventListener('change', recalcularValorCustomizacao);
});

function recalcularValorCustomizacao() {
  if (!produtoSendoCustomizado) return;
  let total = Number(produtoSendoCustomizado.preco) + acrescimoTamanho;

  document.querySelectorAll('.chk-adicional:checked').forEach(c => {
    total += Number(c.dataset.preco);
  });

  document.getElementById('preco-item-final').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

document.getElementById('btn-confirmar-item').addEventListener('click', () => {
  let adicionais = [];
  let valorFinal = Number(produtoSendoCustomizado.preco) + acrescimoTamanho;

  document.querySelectorAll('.chk-adicional:checked').forEach(c => {
    adicionais.push(c.dataset.nome);
    valorFinal += Number(c.dataset.preco);
  });

  const saborRadio = document.querySelector('input[name="sabor"]:checked');
  const sabor = saborRadio ? saborRadio.value : '';
  const obs = document.getElementById('obs-item').value.trim();

  carrinho.push({
    id: `${produtoSendoCustomizado.id}-${Date.now()}`,
    nome: `${produtoSendoCustomizado.nome} (${tamanhoSelecionado})`,
    sabor: sabor,
    adicionais: adicionais.join(', '),
    obs: obs,
    preco: valorFinal,
    qtd: 1
  });

  persistirCarrinho();
  modalCustomizacao.classList.add('hidden');
  modalCarrinho.classList.remove('hidden');
  renderizarCarrinho();
});

window.removerItem = function(id) {
  const index = carrinho.findIndex(i => i.id === id);
  if (index !== -1) {
    if (carrinho[index].qtd > 1) {
      carrinho[index].qtd -= 1;
    } else {
      carrinho.splice(index, 1);
    }
  }
  persistirCarrinho();
  renderizarCarrinho();
};

window.adicionarQtd = function(id) {
  const item = carrinho.find(i => i.id === id);
  if (item) item.qtd += 1;
  persistirCarrinho();
  renderizarCarrinho();
};

function calcularTotais() {
  const totalItens = carrinho.reduce((acc, i) => acc + i.qtd, 0);
  let totalValor = carrinho.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
  if (descontoCupom > 0) totalValor *= (1 - descontoCupom);
  return { totalItens, totalValor };
}

function atualizarInterfaceCarrinho() {
  const { totalItens, totalValor } = calcularTotais();
  const formatado = `R$ ${totalValor.toFixed(2).replace('.', ',')}`;

  badgeSacola.innerText = totalItens;
  barraQtd.innerText = totalItens;
  barraTotal.innerText = formatado;
  carrinhoSubtotal.innerText = formatado;

  barraCheckout.classList.toggle('hidden', totalItens === 0);
}

function renderizarCarrinho() {
  if (carrinho.length === 0) {
    containerItensCarrinho.innerHTML = `
      <div class="py-8 text-center text-slate-400">
        <p class="text-3xl mb-1">🛍️</p>
        <p class="text-xs font-semibold">Sua sacola está vazia.</p>
      </div>`;
    return;
  }

  containerItensCarrinho.innerHTML = '';
  carrinho.forEach(item => {
    const totalLinha = (item.preco * item.qtd).toFixed(2).replace('.', ',');
    containerItensCarrinho.innerHTML += `
      <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
        <div class="flex-1">
          <h4 class="font-extrabold text-xs text-slate-900">${item.nome}</h4>
          ${item.sabor ? `<p class="text-[10px] text-slate-500 font-semibold">• Sabor: ${item.sabor}</p>` : ''}
          ${item.adicionais ? `<p class="text-[10px] text-slate-500 font-semibold">• Adicionais: ${item.adicionais}</p>` : ''}
          ${item.obs ? `<p class="text-[10px] text-amber-600 font-bold">• Obs: ${item.obs}</p>` : ''}
          <span class="text-xs text-slate-900 font-black mt-1 block">R$ ${totalLinha}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="removerItem('${item.id}')" class="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-xs">-</button>
          <span class="text-xs font-black w-4 text-center">${item.qtd}</span>
          <button onclick="adicionarQtd('${item.id}')" class="w-6 h-6 rounded-lg bg-primaria text-white font-black text-xs">+</button>
        </div>
      </div>
    `;
  });
}

// Cupom de Desconto
document.getElementById('btn-aplicar-cupom').addEventListener('click', () => {
  const cod = document.getElementById('input-cupom').value.trim().toUpperCase();
  const msg = document.getElementById('msg-cupom');

  if (cod === 'BEMVINDO10' || cod === 'ZENITE10') {
    descontoCupom = 0.10;
    msg.classList.remove('hidden');
    atualizarInterfaceCarrinho();
  } else {
    alert('Cupom inválido ou expirado.');
  }
});

// Cross-Sell no Carrinho
function renderizarCrossSell() {
  const crossItens = [
    { nome: 'Coca-Cola 350ml', preco: 6.00, emoji: '🥤' },
    { nome: 'Água Mineral', preco: 4.00, emoji: '💧' },
    { nome: 'Brownie Artesanal', preco: 9.00, emoji: '🍫' }
  ];

  crossSellContainer.innerHTML = '';
  crossItens.forEach(item => {
    crossSellContainer.innerHTML += `
      <button onclick="adicionarCrossSell('${item.nome}', ${item.preco})" class="p-2 rounded-xl bg-white border border-slate-200 text-left flex-shrink-0 flex items-center gap-2 active:scale-95 transition shadow-xs">
        <span class="text-base">${item.emoji}</span>
        <div>
          <span class="block text-[11px] font-bold text-slate-900">${item.nome}</span>
          <span class="text-[10px] font-extrabold text-slate-500">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
        </div>
      </button>
    `;
  });
}

window.adicionarCrossSell = function(nome, preco) {
  carrinho.push({
    id: `cross-${Date.now()}`,
    nome: nome,
    preco: preco,
    qtd: 1
  });
  persistirCarrinho();
  renderizarCarrinho();
};

function renderizarCards(lista = produtosCatalogo) {
  listaProdutos.innerHTML = '';
  lista.forEach(p => {
    const valor = Number(p.preco).toFixed(2).replace('.', ',');
    listaProdutos.innerHTML += `
      <div class="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3.5 hover:border-slate-200 transition">
        ${p.imagem_url ? `<img src="${p.imagem_url}" class="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-100" alt="${p.nome}">` : '<div class="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>'}
        <div class="flex-1 min-w-0">
          <h3 class="font-extrabold text-sm text-slate-900 truncate">${p.nome}</h3>
          <p class="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">${p.descricao || ''}</p>
          <span class="block mt-1.5 font-black text-sm text-slate-900">A partir de R$ ${valor}</span>
        </div>
        <button onclick="abrirCustomizacao('${p.id}')" class="bg-primaria text-white text-xs font-bold px-3.5 py-2 rounded-xl active:scale-95 transition shadow-xs">
          Opções ⚙️
        </button>
      </div>
    `;
  });
}

document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cat-pill').forEach(p => {
      p.className = 'cat-pill px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-600';
    });
    pill.className = 'cat-pill active px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-primaria text-white shadow-xs';

    const categoria = pill.dataset.cat;
    if (categoria === 'todos') {
      renderizarCards(produtosCatalogo);
    } else {
      const filtrados = produtosCatalogo.filter(p => p.categoria === categoria || p.nome.toLowerCase().includes(categoria.toLowerCase()));
      renderizarCards(filtrados);
    }
  });
});

inputBusca?.addEventListener('input', (e) => {
  const termo = e.target.value.toLowerCase();
  const filtrados = produtosCatalogo.filter(p => 
    p.nome.toLowerCase().includes(termo) || (p.descricao && p.descricao.toLowerCase().includes(termo))
  );
  renderizarCards(filtrados);
});

btnEnviarPedido.addEventListener('click', async () => {
  if (carrinho.length === 0) return alert('Sua sacola está vazia.');

  const nome = cliNome.value.trim();
  const whats = cliWhats.value.trim();
  const tipoEntrega = tipoEntregaSelect.value;
  const endereco = cliEndereco.value.trim();
  const pagamento = document.getElementById('cli-pagamento').value;

  if (!nome || !whats) return alert('Por favor, informe seu nome e WhatsApp.');
  if (tipoEntrega === 'Entrega' && !endereco) return alert('Informe o endereço de entrega.');

  localStorage.setItem('zenite_cli_nome', nome);
  localStorage.setItem('zenite_cli_whats', whats);
  localStorage.setItem('zenite_cli_endereco', endereco);

  const { totalValor } = calcularTotais();
  const totalFormatado = `R$ ${totalValor.toFixed(2).replace('.', ',')}`;

  let msg = `*NOVO PEDIDO - ${lojaAtual.nome_loja.toUpperCase()}*\n`;
  msg += `--------------------------------\n`;
  msg += `👤 *Cliente:* ${nome}\n`;
  msg += `📱 *WhatsApp:* ${whats}\n`;
  msg += `🛵 *Modalidade:* ${tipoEntrega}\n`;
  if (tipoEntrega === 'Entrega') msg += `📍 *Endereço:* ${endereco}\n`;
  msg += `💳 *Forma de Pagamento:* ${pagamento}\n`;
  if (descontoCupom > 0) msg += `🏷️ *Cupom:* 10% Aplicado\n`;
  msg += `--------------------------------\n`;
  msg += `*ITENS DO PEDIDO:*\n`;

  carrinho.forEach(item => {
    const sub = (item.preco * item.qtd).toFixed(2).replace('.', ',');
    msg += `• ${item.qtd}x ${item.nome} - R$ ${sub}\n`;
    if (item.sabor) msg += `   Sabor: ${item.sabor}\n`;
    if (item.adicionais) msg += `   Adicionais: ${item.adicionais}\n`;
    if (item.obs) msg += `   Obs: ${item.obs}\n`;
  });

  msg += `--------------------------------\n`;
  msg += `*TOTAL A PAGAR: ${totalFormatado}*`;

  const numeroWhats = lojaAtual.whatsapp.replace(/\D/g, '');
  const urlWhats = `https://wa.me/55${numeroWhats}?text=${encodeURIComponent(msg)}`;

  await supabase.from('pedidos').insert([{
    empresa_id: lojaAtual.id,
    cliente_nome: nome,
    cliente_telefone: whats,
    endereco: tipoEntrega === 'Entrega' ? endereco : 'Retirada no balcão',
    itens: carrinho,
    total: totalValor,
    status: 'pendente'
  }]).catch(() => {});

  window.open(urlWhats, '_blank');
});

async function inicializar() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('loja');
  if (!slug) return;

  const { data: loja } = await supabase.from('empresas').select('*').eq('slug', slug).single();
  if (!loja) return;

  lojaAtual = loja;
  document.title = loja.nome_loja;
  document.getElementById('loja-nome').innerText = loja.nome_loja;
  document.documentElement.style.setProperty('--cor-primaria', loja.cor_primaria || '#e11d48');
  if (loja.logo_url) document.getElementById('loja-logo').src = loja.logo_url;

  const { data: produtos } = await supabase.from('produtos').select('*').eq('empresa_id', loja.id).eq('ativo', true);
  produtosCatalogo = produtos || [];

  montarBannersDelivery();
  renderizarCards();
  renderizarCrossSell();
  persistirCarrinho();
}

inicializar();