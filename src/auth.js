import { supabase } from './supabase.js';

let modoCadastro = false;

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const btnSubmit = document.getElementById('btn-submit');
const toggleAuth = document.getElementById('toggle-auth');
const tituloForm = document.getElementById('titulo-form');
const subtituloForm = document.getElementById('subtitulo-form');

// Alterna entre Entrar e Criar Conta
toggleAuth.addEventListener('click', () => {
  modoCadastro = !modoCadastro;
  if (modoCadastro) {
    tituloForm.innerText = 'Criar Nova Conta';
    subtituloForm.innerText = 'Crie sua loja em menos de 2 minutos';
    btnSubmit.innerText = 'Cadastrar e Começar';
    toggleAuth.innerText = 'Já possui conta? Faça login';
  } else {
    tituloForm.innerText = 'Entrar no Painel';
    subtituloForm.innerText = 'Gerencie sua vitrine e produtos';
    btnSubmit.innerText = 'Entrar';
    toggleAuth.innerText = 'Não tem uma conta? Cadastre-se aqui';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = senhaInput.value.trim();

  btnSubmit.disabled = true;
  btnSubmit.innerText = 'Processando...';

  try {
    if (modoCadastro) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      alert('Conta criada com sucesso! Redirecionando...');
      window.location.href = '/painel.html';
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.href = '/painel.html';
    }
  } catch (err) {
    alert('Erro de autenticação: ' + err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = modoCadastro ? 'Cadastrar e Começar' : 'Entrar';
  }
});