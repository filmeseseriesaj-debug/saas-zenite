import { supabase } from './supabase.js';

let usuarioLogado = null;
let lojaAtualId = null;

const formLoja = document.getElementById('form-loja');
const formProduto = document.getElementById('form-produto');
const nichoSelect = document.getElementById('nicho');
const corInput = document.getElementById('cor_primaria');
const hexPreview = document.getElementById('hex-preview');
const btnVerLoja = document.getElementById('btn-ver-loja');
const labelProdNome = document.getElementById('label-prod-nome');
const btnCadastrarItem = document.getElementById('btn-cadastrar-item');
const tituloSecaoItens = document.getElementById('titulo-secao-itens');

// Atualiza preview de cor
corInput.addEventListener('input', (e) => {
  hexPreview.innerText = e.target.value;
});

// Adapta rótulos na tela conforme o nicho escolhido
function adaptarInterfacePorNicho(nicho) {
  if (nicho === 'servicos') {
    tituloSecaoItens.innerText = '2. Adicionar Serviço / Procedimento';
    labelProdNome.innerText = 'Nome do Serviço';
    btnCadastrarItem.innerText = 'Cadastrar Serviço na Agenda';
  } else {
    tituloSecaoItens.innerText = '2. Adicionar Produto no Cardápio/Catálogo';
    labelProdNome.innerText = 'Nome do Produto';
    btnCadastrarItem.innerText = 'Cadastrar Produto no Catálogo';
  }
}

nichoSelect.addEventListener('change', (e) => {
  adaptarInterfacePorNicho(e.target.value);
});

// Checa a sessão do usuário
function verificarSessao() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      window.location.href = '/login.html';
      return;
    }

    usuarioLogado = session.user;

    if (!document.getElementById('btn-logout')) {
      const header = document.querySelector('h1').parentElement;
      const btnLogout = document.createElement('button');
      btnLogout.id = 'btn-logout';
      btnLogout.innerText = 'Sair da Conta';
      btnLogout.className = 'text-xs text-red-500 hover:underline block mt-1 font-medium';
      btnLogout.onclick = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login.html';
      };
      header.appendChild(btnLogout);
    }

    await carregarDadosLoja();
  });
}

// Carrega os dados da loja vinculada
async function carregarDadosLoja() {
  const { data: loja } = await supabase
    .from('empresas')
    .select('*')
    .eq('usuario_id', usuarioLogado.id)
    .single();

  if (loja) {
    lojaAtualId = loja.id;
    document.getElementById('nome_loja').value = loja.nome_loja;
    document.getElementById('slug').value = loja.slug;
    document.getElementById('whatsapp').value = loja.whatsapp;
    if (loja.nicho) {
      nichoSelect.value = loja.nicho;
      adaptarInterfacePorNicho(loja.nicho);
    }
    corInput.value = loja.cor_primaria || '#e11d48';
    hexPreview.innerText = corInput.value;
    if (loja.logo_url) document.getElementById('logo_url').value = loja.logo_url;

    atualizarBotaoVisualizacao(loja.slug, loja.nicho);
  }
}

// Configura o link para o motor correto
function atualizarBotaoVisualizacao(slug, nicho) {
  let urlDestino = '';
  if (nicho === 'servicos') {
    urlDestino = `/agendamento.html?loja=${slug}`;
  } else {
    urlDestino = `/loja.html?loja=${slug}`;
  }

  btnVerLoja.href = urlDestino;
  btnVerLoja.classList.remove('hidden');
}

// Salva / Atualiza a Empresa com o Nicho
formLoja.addEventListener('submit', async (e) => {
  e.preventDefault();

  const slug = document.getElementById('slug').value.trim().toLowerCase();
  const nicho = nichoSelect.value;

  const dadosLoja = {
    usuario_id: usuarioLogado.id,
    nome_loja: document.getElementById('nome_loja').value.trim(),
    slug: slug,
    nicho: nicho,
    whatsapp: document.getElementById('whatsapp').value.trim(),
    cor_primaria: corInput.value,
    logo_url: document.getElementById('logo_url').value.trim() || null,
    plano_ativo: true
  };

  const { data, error } = await supabase
    .from('empresas')
    .upsert(dadosLoja, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    alert('Erro ao salvar empresa: ' + error.message);
    return;
  }

  lojaAtualId = data.id;
  alert('Empresa e motor atualizados com sucesso!');

  atualizarBotaoVisualizacao(data.slug, data.nicho);
});

// Cadastra Produto ou Serviço vinculado à Loja
formProduto.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!lojaAtualId) {
    alert('Configure e salve os dados da sua empresa primeiro!');
    return;
  }

  const dadosProduto = {
    empresa_id: lojaAtualId,
    nome: document.getElementById('prod_nome').value.trim(),
    preco: parseFloat(document.getElementById('prod_preco').value),
    categoria: document.getElementById('prod_categoria').value.trim() || null,
    descricao: document.getElementById('prod_descricao').value.trim(),
    imagem_url: document.getElementById('prod_imagem').value.trim() || null,
    ativo: true
  };

  const { error } = await supabase.from('produtos').insert([dadosProduto]);

  if (error) {
    alert('Erro ao cadastrar: ' + error.message);
    return;
  }

  alert('Item cadastrado com sucesso!');
  document.getElementById('prod_nome').value = '';
  document.getElementById('prod_preco').value = '';
  document.getElementById('prod_descricao').value = '';
  document.getElementById('prod_imagem').value = '';
});

verificarSessao();