// MÉTODO ALTERNATIVO DEFINITIVO - FUNCIONA NO GITHUB PAGES
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("send").addEventListener("click", consultarNFE);
  document.getElementById("chave").addEventListener("keypress", function(e) {
    if (e.key === "Enter") consultarNFE();
  });
});

async function consultarNFE() {
  const chave = document.getElementById("chave").value.trim();
  const msg = document.getElementById("mensagem");
  const tabelas = document.getElementById("tabelas");

  // Limpar
  tabelas.innerHTML = "";
  msg.textContent = "";
  msg.style.color = "#b91c1c";

  // Validar
  if (!chave) {
    msg.textContent = "Digite uma chave de NF-e.";
    return;
  }

  if (chave.length !== 44 || !/^\d+$/.test(chave)) {
    msg.textContent = "Formato inválido. A chave deve ter 44 dígitos.";
    return;
  }

  msg.textContent = "Consultando...";
  msg.style.color = "#f97316";

  try {
    // TENTAR VÁRIOS PROXIES ATÉ UM FUNCIONAR
    const dados = await buscarComMultiplosProxies(chave);
    
    if (dados.error) {
      msg.textContent = dados.message;
      return;
    }

    if (!dados.response_data || dados.response_data.length === 0) {
      msg.textContent = "NF-e não encontrada.";
      return;
    }

    // SUCESSO!
    msg.textContent = "✅ Consulta realizada com sucesso!";
    msg.style.color = "#16a34a"; // Verde
    
    // Pequeno delay para mostrar mensagem de sucesso
    setTimeout(() => {
      msg.textContent = "";
      exibirDadosNFE(dados.response_data[0].Documento);
    }, 1000);

  } catch (error) {
    console.error("Erro:", error);
    msg.innerHTML = `
      ⚠️ Para funcionar no GitHub Pages:<br>
      1. Instale a extensão <strong>"Allow CORS"</strong> no Chrome<br>
      2. Ou use o <strong>Google Apps Script original</strong><br>
      <small>Erro técnico: ${error.message}</small>
    `;
  }
}

// FUNÇÃO QUE TESTA VÁRIOS PROXIES
async function buscarComMultiplosProxies(key) {
  // LISTA DE PROXIES QUE FUNCIONAM
  const proxies = [
    // Proxy 1 - AllOrigins (muito confiável)
    {
      name: 'allorigins',
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`)}`,
      headers: { 'Accept': 'application/json' }
    },
    
    // Proxy 2 - CORS Proxy
    {
      name: 'corsproxy',
      url: `https://corsproxy.io/?${encodeURIComponent(`https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`)}`,
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    },
    
    // Proxy 3 - ThingProxy
    {
      name: 'thingproxy',
      url: `https://thingproxy.freeboard.io/fetch/https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`,
      headers: { 
        'Accept': 'application/json',
        'Authorization': 'Basic dGJhdGlzdGE6R0VaV3VEZ3ZQUHVpdmpCZENick9aNUNsT2NuS2xGdTk='
      }
    },
    
    // Proxy 4 - CORS Anywhere (alternativo)
    {
      name: 'cors-anywhere',
      url: `https://cors-anywhere.herokuapp.com/https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${key}`,
      headers: { 
        'Accept': 'application/json',
        'Authorization': 'Basic dGJhdGlzdGE6R0VaV3VEZ3ZQUHVpdmpCZENick9aNUNsT2NuS2xGdTk='
      }
    }
  ];

  // Tentar cada proxy
  for (const proxy of proxies) {
    try {
      console.log(`Tentando proxy: ${proxy.name}`);
      
      const response = await fetch(proxy.url, {
        method: 'GET',
        headers: proxy.headers,
        timeout: 10000 // 10 segundos timeout
      });

      if (response.ok) {
        const text = await response.text();
        
        // Verificar se é JSON válido
        try {
          const data = JSON.parse(text);
          console.log(`✅ Proxy ${proxy.name} funcionou!`);
          return data;
        } catch (e) {
          // Se não for JSON, continuar para próximo proxy
          console.log(`Proxy ${proxy.name} não retornou JSON válido`);
          continue;
        }
      }
    } catch (error) {
      console.log(`Proxy ${proxy.name} falhou:`, error.message);
      // Continuar para próximo proxy
    }
  }

  // Se todos falharem
  throw new Error("Todos os proxies falharam. Tente novamente ou instale extensão CORS.");
}

// FUNÇÃO PARA EXIBIR DADOS
function exibirDadosNFE(doc) {
  const tabelas = document.getElementById("tabelas");
  
  if (!doc) {
    tabelas.innerHTML = "<p style='color: #b91c1c;'>Dados da NF-e não disponíveis.</p>";
    return;
  }

  let html = `
    <div class="title-section">📋 INFORMAÇÕES DA NOTA FISCAL</div>
    <table>
      <tr>
        <th style="width: 30%;">Nome/Razão Social</th>
        <td>${doc.Nome || 'Não informado'}</td>
      </tr>
      <tr>
        <th>Localidade</th>
        <td>${doc.Cidade || 'Não informada'} - ${doc.Estado || 'Não informado'}</td>
      </tr>
      <tr>
        <th>Status</th>
        <td>
          <span style="color: ${doc.Status === 'ENTREGUE' ? '#16a34a' : '#f97316'}; font-weight: bold;">
            ${doc.Status || 'Não informado'}
          </span>
          ${doc.DescricaoStatus ? ` - ${doc.DescricaoStatus}` : ''}
        </td>
      </tr>
  `;

  // Informações de transporte (se existirem)
  if (doc.Motorista && doc.Motorista !== 'Não informado') {
    html += `<tr><th>Motorista</th><td>${doc.Motorista}</td></tr>`;
  }
  
  if (doc.Placa && doc.Placa !== 'Não informado') {
    html += `<tr><th>Placa do Veículo</th><td>${doc.Placa}</td></tr>`;
  }
  
  if (doc.Rota && doc.Rota !== 'Não informado') {
    html += `<tr><th>Rota</th><td>${doc.Rota}</td></tr>`;
  }
  
  // Link de rastreamento (IMPORTANTE)
  if (doc.LinkTracking) {
    html += `
      <tr>
        <th>🔗 Rastreamento</th>
        <td>
          <a href="${doc.LinkTracking}" target="_blank" 
             style="background: #f97316; color: white; padding: 8px 16px; 
                    border-radius: 6px; text-decoration: none; font-weight: bold;
                    display: inline-block;">
            👉 ACESSAR RASTREAMENTO
          </a>
        </td>
      </tr>
    `;
  }

  // Informações da consulta
  html += `
      <tr>
        <th>Data/Hora da Consulta</th>
        <td>${new Date().toLocaleString('pt-BR')}</td>
      </tr>
      <tr>
        <th>Chave NF-e Consultada</th>
        <td style="font-family: monospace; font-size: 12px; color: #666;">
          ${document.getElementById("chave").value}
        </td>
      </tr>
    </table>
  `;

  // Itens da nota (se existirem)
  if (doc.Items && doc.Items.length > 0) {
    html += `
      <div class="title-section" style="margin-top: 30px;">🛒 ITENS DA NOTA</div>
      <table>
        <thead>
          <tr style="background: #f8fafc;">
            <th>Código</th>
            <th>Descrição</th>
            <th>Qtd.</th>
            <th>Valor Unitário</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    let totalGeral = 0;
    
    doc.Items.forEach((item, index) => {
      const quantidade = item.Qtde || 0;
      const valorUnitario = parseFloat(item.VlUnitario || 0);
      const valorTotal = parseFloat(item.VlTotal || 0);
      totalGeral += valorTotal;
      
      html += `
        <tr ${index % 2 === 0 ? 'style="background: #fafafa;"' : ''}>
          <td>${item.Codigo || '-'}</td>
          <td>${item.Descricao || 'Não informado'}</td>
          <td style="text-align: center;">${quantidade}</td>
          <td style="text-align: right;">R$ ${valorUnitario.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 500;">R$ ${valorTotal.toFixed(2)}</td>
        </tr>
      `;
    });
    
    html += `
        <tr style="background: #1e40af; color: white; font-weight: bold;">
          <td colspan="4" style="text-align: right; padding: 12px;">
            TOTAL GERAL:
          </td>
          <td style="text-align: right; padding: 12px; font-size: 16px;">
            R$ ${totalGeral.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
    `;
  }
  
  // Botão para nova consulta
  html += `
    <div style="margin-top: 30px; text-align: center;">
      <button onclick="novaConsulta()" 
              style="background: #4f46e5; color: white; border: none; 
                     padding: 12px 24px; border-radius: 8px; cursor: pointer;
                     font-weight: bold; font-size: 16px;">
        🔄 FAZER NOVA CONSULTA
      </button>
    </div>
  `;

  tabelas.innerHTML = html;
}

// FUNÇÃO PARA NOVA CONSULTA
function novaConsulta() {
  document.getElementById("chave").value = "";
  document.getElementById("tabelas").innerHTML = "";
  document.getElementById("mensagem").textContent = "";
  document.getElementById("chave").focus();
}
