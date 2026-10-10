import { supabase } from './supabase.js';

let lojaAtual = null;
let servicosCatalogo = [];
let profissionalSelecionado = 'Qualquer disponível';
let dataSelecionada = null;
let horarioSelecionado = null;
let descontoCupom = 0;

// Carrinho de Serviços no LocalStorage (F5 não apaga)
let servicosSelecionados = JSON.parse(localStorage.getItem('zenite_servicos_booking') || '[]');

// DOM Elements
const modalAgendamento = document.getElementById('modal-agendamento');
const btnTopoAgendados = document.getElementById('btn-topo-agendados');
const btnAvancarData = document.getElementById('btn-avancar-data');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const barraBooking = document.getElementById('barra-booking-fixa');
const barraQtd = document.getElementById('barra-qtd-servicos');
const barraTotal = document.getElementById('barra-total-booking');
const badgeServicos = document.getElementById('badge-servicos');
const precoTotalFinal = document.getElementById('preco-total-final');
const resumoServicos = document.getElementById('resumo-servicos-selecionados');
const bookingResumoEl = document.getElementById('booking-itens-resumo');
const listaServicos = document.getElementById('lista-servicos');
const carrosselDias = document.getElementById('carrossel-dias');
const slotsManha = document.getElementById('slots-manha');
const slotsTarde = document.getElementById('slots-tarde');
const inputBusca = document.getElementById('input-busca');
const cliNome = document.getElementById('cli-nome');
const cliWhats = document.getElementById('cli-whats');
const bannerSlides = document.getElementById('banner-slides');
const bannerDots = document.getElementById('banner-dots');

cliNome.value = localStorage.getItem('zenite_cli_nome') || '';
cliWhats.value = localStorage.getItem('zenite_cli_whats') || '';

// Banners Clicáveis (Serviços em Destaque & Vagas Limitadas)
const bannersAgendamento = [
  {
    titulo: 'Combo Barba Terapia + Corte',
    subtitulo: 'Toalha quente, massagem facial e corte alinhado',
    badge: '⭐ O MAIS AGENDADO',
    preco: 'R$ 75,00',
    imagem: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    acao: () => {
      if (servicosCatalogo.length > 0) {
        window.alternarServico(servicosCatalogo[0].id);
        modalAgendamento.classList.remove('hidden');
      }
    }
  },
  {
    titulo: 'Tratamentos & Cuidados VIP',
    subtitulo: 'Protocolo completo de renovação capilar',
    badge: '💆 PROMOÇÃO DA SEMANA',
    preco: 'R$ 60,00',
    imagem: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    acao: () => {
      const tabEstetica = document.querySelector('[data-cat="Estética"]');
      if (tabEstetica) tabEstetica.click();
      listaServicos?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  {
    titulo: 'Reserve para o Final de Semana',
    subtitulo: 'Garanta seu horário com nossos especialistas',
    badge: '📅 VAGAS LIMITADAS',
    preco: 'A partir de R$ 35,00',
    imagem: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    acao: () => {
      listaServicos?.scrollIntoView({ behavior: 'smooth' });
    }
  }
];

let slideAtual = 0;

function montarBannersAgendamento() {
  if (!bannerSlides) return;
  bannerSlides.innerHTML = '';
  bannerDots.innerHTML = '';

  bannersAgendamento.forEach((b, idx) => {
    const slide = document.createElement('div');
    slide.className = 'w-full h-full relative flex-shrink-0 cursor-pointer overflow-hidden';
    slide.innerHTML = `
      <img src="${b.imagem}" class="w-full h-full object-cover" alt="${b.titulo}" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-4">
        <span class="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider mb-1">${b.badge}</span>
        <h3 class="text-white font-extrabold text-base leading-tight">${b.titulo}</h3>
        <p class="text-slate-300 text-[11px] font-medium line-clamp-1">${b.subtitulo}</p>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-white font-black text-sm">${b.preco}</span>
          <span class="bg-primaria text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm">
            Agendar Horário ➔
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
  slideAtual = (slideAtual + 1) % bannersAgendamento.length;
  if (bannerSlides) bannerSlides.style.transform = `translateX(-${slideAtual * 100}%)`;

  const dots = bannerDots?.querySelectorAll('div');
  dots?.forEach((d, idx) => {
    d.className = idx === slideAtual ? 'w-2.5 h-1.5 rounded-full bg-white transition-all' : 'w-1.5 h-1.5 rounded-full bg-white/40 transition-all';
  });
}, 4000);

function persistirServicos() {
  localStorage.setItem('zenite_servicos_booking', JSON.stringify(servicosSelecionados));
  atualizarInterface();
}

btnTopoAgendados.addEventListener('click', () => { if (servicosSelecionados.length > 0) modalAgendamento.classList.remove('hidden'); });
btnAvancarData.addEventListener('click', () => modalAgendamento.classList.remove('hidden'));
btnFecharModal.addEventListener('click', () => modalAgendamento.classList.add('hidden'));

window.alternarServico = function(id) {
  const index = servicosSelecionados.findIndex(s => s.id === id);
  if (index !== -1) {
    servicosSelecionados.splice(index, 1);
  } else {
    const s = servicosCatalogo.find(item => item.id === id);
    if (!s) return;
    servicosSelecionados.push({ id: s.id, nome: s.nome, preco: Number(s.preco), duracao: '45 min' });
  }
  persistirServicos();
  renderizarCards();
};

function calcularTotais() {
  const totalQtd = servicosSelecionados.length;
  let totalValor = servicosSelecionados.reduce((acc, s) => acc + s.preco, 0);
  if (descontoCupom > 0) totalValor *= (1 - descontoCupom);
  return { totalQtd, totalValor };
}

function atualizarInterface() {
  const { totalQtd, totalValor } = calcularTotais();
  const formatado = `R$ ${totalValor.toFixed(2).replace('.', ',')}`;

  badgeServicos.innerText = totalQtd;
  barraQtd.innerText = totalQtd;
  barraTotal.innerText = formatado;
  precoTotalFinal.innerText = formatado;
  resumoServicos.innerText = `${totalQtd} serviço(s) selecionado(s)`;

  barraBooking.classList.toggle('hidden', totalQtd === 0);

  bookingResumoEl.innerHTML = '';
  servicosSelecionados.forEach(s => {
    bookingResumoEl.innerHTML += `
      <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
        <div>
          <span class="block text-xs font-bold text-slate-900">${s.nome}</span>
          <span class="text-[10px] text-slate-500 font-semibold">R$ ${s.preco.toFixed(2).replace('.', ',')}</span>
        </div>
        <button onclick="alternarServico('${s.id}')" class="text-xs text-rose-500 font-bold px-2 py-1">Remover</button>
      </div>
    `;
  });
}

function renderizarCards(lista = servicosCatalogo) {
  listaServicos.innerHTML = '';
  lista.forEach(s => {
    const selecionado = servicosSelecionados.some(item => item.id === s.id);
    const valor = Number(s.preco).toFixed(2).replace('.', ',');

    listaServicos.innerHTML += `
      <div onclick="alternarServico('${s.id}')" class="bg-white p-3.5 rounded-2xl border ${selecionado ? 'border-primaria ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-100'} shadow-sm flex items-center justify-between gap-3.5 cursor-pointer hover:border-slate-200 transition active:scale-98">
        <div class="flex-1 min-w-0">
          <h3 class="font-extrabold text-sm text-slate-900 truncate">${s.nome}</h3>
          <p class="text-xs text-slate-400 line-clamp-1 mt-0.5 font-medium">${s.descricao || 'Atendimento profissional'}</p>
          <div class="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-semibold">
            <span class="text-indigo-600">⏱ 45 min</span>
            <span>•</span>
            <span class="text-slate-900 font-black">R$ ${valor}</span>
          </div>
        </div>
        <span class="text-xs font-bold px-3 py-1.5 rounded-xl ${selecionado ? 'bg-primaria text-white shadow-xs' : 'bg-slate-100 text-slate-700'}">
          ${selecionado ? '✓ Adicionado' : '+ Escolher'}
        </span>
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

    const cat = pill.dataset.cat;
    if (cat === 'todos') {
      renderizarCards(servicosCatalogo);
    } else {
      const filtrados = servicosCatalogo.filter(s => s.nome.toLowerCase().includes(cat.toLowerCase()) || (s.descricao && s.descricao.toLowerCase().includes(cat.toLowerCase())));
      renderizarCards(filtrados);
    }
  });
});

inputBusca?.addEventListener('input', (e) => {
  const termo = e.target.value.toLowerCase();
  const filtrados = servicosCatalogo.filter(s => s.nome.toLowerCase().includes(termo));
  renderizarCards(filtrados);
});

document.querySelectorAll('.opt-pro').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.opt-pro').forEach(b => {
      b.className = 'opt-pro p-2 rounded-xl border text-center border-slate-200 bg-slate-50 text-slate-700';
    });
    btn.className = 'opt-pro p-2 rounded-xl border text-center border-primaria bg-primaria text-white';
    profissionalSelecionado = btn.dataset.pro;
  });
});

function gerarDias() {
  carrosselDias.innerHTML = '';
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const diaTexto = diasSemana[d.getDay()];
    const diaNum = d.getDate();
    const mesTexto = meses[d.getMonth()];
    const iso = d.toISOString().split('T')[0];

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `p-2.5 rounded-2xl border text-center flex flex-col items-center min-w-[62px] transition ${
      i === 0 ? 'border-primaria bg-primaria text-white shadow-md' : 'border-slate-200 bg-slate-50 text-slate-700'
    }`;
    btn.innerHTML = `
      <span class="text-[10px] font-bold uppercase opacity-80">${diaTexto}</span>
      <span class="text-sm font-black my-0.5">${diaNum}</span>
      <span class="text-[9px] font-semibold opacity-70">${mesTexto}</span>
    `;

    if (i === 0) dataSelecionada = iso;

    btn.onclick = () => {
      document.querySelectorAll('#carrossel-dias button').forEach(b => {
        b.className = 'p-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 text-center flex flex-col items-center min-w-[62px]';
      });
      btn.className = 'p-2.5 rounded-2xl border border-primaria bg-primaria text-white text-center flex flex-col items-center min-w-[62px] shadow-md';
      dataSelecionada = iso;
    };

    carrosselDias.appendChild(btn);
  }
}

function renderizarHorarios() {
  const horasManha = ['09:00', '09:40', '10:20', '11:00'];
  const horasTarde = ['13:30', '14:20', '15:10', '16:00', '17:00', '18:00'];

  const criarSlot = (h) => {
    const btn = document.createElement('button');
    btn.innerText = h;
    btn.className = 'py-2 text-xs font-extrabold rounded-xl border border-slate-200 bg-white text-slate-700 active:scale-95 transition text-center';
    btn.onclick = () => {
      document.querySelectorAll('#slots-manha button, #slots-tarde button').forEach(b => {
        b.className = 'py-2 text-xs font-extrabold rounded-xl border border-slate-200 bg-white text-slate-700 transition text-center';
      });
      btn.className = 'py-2 text-xs font-extrabold rounded-xl border border-primaria bg-primaria text-white shadow transition text-center';
      horarioSelecionado = h;
    };
    return btn;
  };

  slotsManha.innerHTML = '';
  horasManha.forEach(h => slotsManha.appendChild(criarSlot(h)));

  slotsTarde.innerHTML = '';
  horasTarde.forEach(h => slotsTarde.appendChild(criarSlot(h)));
}

document.getElementById('btn-aplicar-cupom').addEventListener('click', () => {
  const cod = document.getElementById('input-cupom').value.trim().toUpperCase();
  const msg = document.getElementById('msg-cupom');

  if (cod === 'CLIENTEVIP' || cod === 'PRIMEIRAVEZ') {
    descontoCupom = 0.15;
    msg.classList.remove('hidden');
    atualizarInterface();
  } else {
    alert('Cupom de agendamento não encontrado.');
  }
});

document.getElementById('btn-confirmar-agendamento').addEventListener('click', async () => {
  if (servicosSelecionados.length === 0) return alert('Selecione ao menos um serviço.');
  if (!horarioSelecionado) return alert('Escolha um horário para atendimento.');

  const nome = cliNome.value.trim();
  const whats = cliWhats.value.trim();

  if (!nome || !whats) return alert('Informe seu nome e WhatsApp.');

  localStorage.setItem('zenite_cli_nome', nome);
  localStorage.setItem('zenite_cli_whats', whats);

  const [ano, mes, dia] = dataSelecionada.split('-');
  const { totalValor } = calcularTotais();

  let msg = `*SOLICITAÇÃO DE AGENDAMENTO - ${lojaAtual.nome_loja.toUpperCase()}*\n`;
  msg += `--------------------------------\n`;
  msg += `👤 *Cliente:* ${nome}\n`;
  msg += `📱 *WhatsApp:* ${whats}\n`;
  msg += `✂️ *Profissional:* ${profissionalSelecionado}\n`;
  msg += `📅 *Data:* ${dia}/${mes}/${ano}\n`;
  msg += `⏰ *Horário:* ${horarioSelecionado}\n`;
  if (descontoCupom > 0) msg += `🏷️ *Cupom:* 15% Desconto Aplicado\n`;
  msg += `--------------------------------\n`;
  msg += `*SERVIÇOS ESCOLHIDOS:*\n`;

  servicosSelecionados.forEach(s => {
    msg += `• ${s.nome} - R$ ${s.preco.toFixed(2).replace('.', ',')}\n`;
  });

  msg += `--------------------------------\n`;
  msg += `*TOTAL ESTIMADO: R$ ${totalValor.toFixed(2).replace('.', ',')}*`;

  const numeroWhats = lojaAtual.whatsapp.replace(/\D/g, '');
  const url = `https://wa.me/55${numeroWhats}?text=${encodeURIComponent(msg)}`;

  await supabase.from('agendamentos').insert([{
    empresa_id: lojaAtual.id,
    cliente_nome: nome,
    cliente_whatsapp: whats,
    data_agendamento: dataSelecionada,
    hora_agendamento: horarioSelecionado,
    status: 'pendente'
  }]).catch(() => {});

  window.open(url, '_blank');
});

async function inicializar() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('loja');
  if (!slug) return;

  const { data: loja } = await supabase.from('empresas').select('*').eq('slug', slug).single();
  if (!loja) return;

  lojaAtual = loja;
  document.title = `${loja.nome_loja} - Agendamento`;
  document.getElementById('loja-nome').innerText = loja.nome_loja;
  document.documentElement.style.setProperty('--cor-primaria', loja.cor_primaria || '#4f46e5');
  if (loja.logo_url) document.getElementById('loja-logo').src = loja.logo_url;

  const { data: servicos } = await supabase.from('produtos').select('*').eq('empresa_id', loja.id).eq('ativo', true);
  servicosCatalogo = servicos || [];

  montarBannersAgendamento();
  renderizarCards();
  gerarDias();
  renderizarHorarios();
  atualizarInterface();
}

inicializar();