// Configuração
const API_BASE_URL = 'https://api.comprovei.com.br/api/1.1';
const AUTH_TOKEN = 'Basic dGJhdGlzdGE6R0VaV3VEZ3ZQUHVpdmpCZENick9aNUNsT2NuS2xGdTk=';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById("send");
  const chaveInput = document.getElementById("chave");
  
  if (sendBtn) {
    sendBtn.addEventListener("click", consultarNFE);
  }
  
  if (chaveInput) {
    chaveInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        consultarNFE();
      }
    });
    
    // Focar no input ao carregar
    chaveInput.focus();
  }
});

// Função principal de consulta
async function consultarNFE() {
  const chave = document.getElementById("chave").value.trim();
  const msg = document.getElementById("mensagem");
  const tabelas = document.getElementById("tabelas");

  // Reset
  tabelas.innerHTML = "";
  msg.textContent = "";
  msg.style.color = "#b91c1c";

  // Validações
  if (!chave) {
    msg.textContent = "Digite uma chave de NF-e válida.";
    return;
  }

  if (chave.length !== 44 || !/^\d+$/.test(chave)) {
    msg.textContent = "Formato inválido. A chave NF-e deve ter 44 dígitos numéricos.";
    return;
  }

  // Mostrar carregamento
  msg.textContent = "Consultando...";
  msg.style.color = "#f97316";

  try {
    // Fazer a requisição usando CORS proxy
    const dados = await buscarRastreio(chave);
    
    // Processar resposta
    if (dados.error) {
      msg.textContent = dados.message;
      return;
    }

    if (!dados.response_data || dados.response_data.length === 0) {
      msg.textContent = "NF-e não encontrada ou chave inválida.";
      return;
    }

    // Limpar mensagem
    msg.textContent = "";
    
    // Exibir dados
    exibirDadosNFE(dados.response_data[0].Documento);

  } catch (error) {
    console.error("Erro na consulta:", error);
    
    // Tentar método alternativo se o primeiro falhar
    try {
      msg.textContent = "Tentando método alternativo...";
      const dados = await buscarRastreioAlternativo(chave);
      
      if (dados.error) {
        msg.textContent = `Erro: ${dados.message}`;
        return;
      }
      
      if (!dados.response_data || dados.response_data.length === 0) {
        msg.textContent = "NF-e não encontrada.";
        return;
      }
      
      msg.textContent = "";
      exibirDadosNFE(dados.response_data[0].Documento);
      
    } catch (error2) {
      msg.textContent = `Não foi possível conectar à API. Possíveis causas:
        1. Problema de CORS (tente extensão "Allow CORS")
        2. API temporariamente indisponível
        3. Chave inválida
        
        Erro técnico: ${error2.message}`;
    }
  }
}

// Função principal de busca (simulando google.script.run)
async function buscarRastreio(key) {
  const url = `${API_BASE_URL}/documents/getStatus?key=${encodeURIComponent(key)}`;
  
  try {
    // Tentativa 1: Requisição direta (pode falhar por CORS)
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": AUTH_TOKEN,
        "Accept": "application/json"
      },
      mode: 'cors' // Tenta fazer requisição CORS
    });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    // Se falhar por CORS, tentar método alternativo
    console.log("Requisição direta falhou, tentando proxy...", error.message);
    return await buscarViaProxy(key);
  }
}

// Método alternativo usando proxy CORS
async function buscarViaProxy(key) {
  try {
    // Usar um proxy CORS público
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`)}`,
      `https://corsproxy.io/?${encodeURIComponent(`https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`)}`
    ];
    
    // Tentar cada proxy até um funcionar
    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            "Accept": "application/json"
          }
        });
        
        if (response.ok) {
          const text = await response.text();
          return JSON.parse(text);
        }
      } catch (e) {
        console.log(`Proxy falhou: ${proxyUrl}`, e);
        continue;
      }
    }
    
    throw new Error("Todos os proxies falharam");
    
  } catch (error) {
    return { 
      error: true, 
      message: "Não foi possível acessar a API devido a restrições de CORS. Considere usar o Google Apps Script original." 
    };
  }
}

// Função alternativa (fallback)
async function buscarRastreioAlternativo(key) {
  // Outra abordagem: criar uma requisição com no-cors (menos informações)
  try {
    const response = await fetch(`https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`, {
      method: 'GET',
      mode: 'no-cors', // Modo no-cors (limitado)
      headers: {
        'Authorization': AUTH_TOKEN
      }
    });
    
    // Nota: no-cors não permite ler a resposta, então esta abordagem não funciona bem
    return { error: true, message: "Modo no-cors não suportado para esta API" };
    
  } catch (error) {
    return { error: true, message: error.message };
  }
}

// Função para exibir os dados da NFE
function exibirDadosNFE(doc) {
  const tabelas = document.getElementById("tabelas");
  
  if (!doc) {
    tabelas.innerHTML = "<p style='color: #b91c1c;'>Dados da NF-e não disponíveis.</p>";
    return;
  }

  // Informações principais
  let html = `
    <div class="title-section">Informações da Nota</div>
    <table>
      <tr><th>Nome</th><td>${doc.Nome || 'Não informado'}</td></tr>
      <tr><th>Cidade/Estado</th><td>${doc.Cidade || 'Não informada'} - ${doc.Estado || 'Não informado'}</td></tr>
      <tr><th>Status</th><td>${doc.Status || 'Não informado'} - ${doc.DescricaoStatus || 'Não informado'}</td></tr>
      <tr><th>Motorista</th><td>${doc.Motorista || 'Não informado'}</td></tr>
      <tr><th>Placa</th><td>${doc.Placa || 'Não informado'}</td></tr>
      <tr><th>Rota</th><td>${doc.Rota || 'Não informado'}</td></tr>
  `;
  
  // Link de rastreamento
  if (doc.LinkTracking) {
    html += `<tr><th>Rastreamento do Pedido</th><td><a href="${doc.LinkTracking}" target="_blank" rel="noopener noreferrer">Abrir Rastreamento</a></td></tr>`;
  } else {
    html += `<tr><th>Rastreamento do Pedido</th><td>Não disponível</td></tr>`;
  }
  
  html += `</table>`;
  
  // Itens da nota (se existirem)
  if (doc.Items && doc.Items.length > 0) {
    html += `
      <div class="title-section" style="margin-top: 30px;">Itens da Nota</div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Quantidade</th>
            <th>Valor Unitário</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    let totalGeral = 0;
    doc.Items.forEach(item => {
      const vlUnitario = parseFloat(item.VlUnitario || 0);
      const vlTotal = parseFloat(item.VlTotal || 0);
      totalGeral += vlTotal;
      
      html += `
        <tr>
          <td>${item.Codigo || ''}</td>
          <td>${item.Descricao || ''}</td>
          <td>${item.Qtde || 0}</td>
          <td>R$ ${vlUnitario.toFixed(2)}</td>
          <td>R$ ${vlTotal.toFixed(2)}</td>
        </tr>
      `;
    });
    
    html += `
        <tr style="font-weight: bold; background-color: #f8fafc;">
          <td colspan="4" style="text-align: right;">TOTAL GERAL:</td>
          <td>R$ ${totalGeral.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>`;
  }
  
  // Informações adicionais
  html += `
    <div class="title-section" style="margin-top: 30px;">Informações Adicionais</div>
    <table>
      <tr><th>Chave Consultada</th><td>${document.getElementById("chave").value}</td></tr>
      <tr><th>Data da Consulta</th><td>${new Date().toLocaleString('pt-BR')}</td></tr>
    </table>
  `;
  
  tabelas.innerHTML = html;
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}
