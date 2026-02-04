// Inicializar
document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById("send");
  const chaveInput = document.getElementById("chave");
  
  if (sendBtn) {
    sendBtn.addEventListener("click", consultarNFE);
  }
  
  if (chaveInput) {
    chaveInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") consultarNFE();
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

  // Limpar resultados anteriores
  tabelas.innerHTML = "";
  msg.textContent = "";
  msg.className = "";

  // Validações
  if (!chave) {
    msg.textContent = "⚠️ Digite uma chave de NF-e.";
    msg.className = "error";
    return;
  }

  if (chave.length !== 44 || !/^\d+$/.test(chave)) {
    msg.textContent = "❌ Formato inválido. A chave NF-e deve ter 44 dígitos numéricos.";
    msg.className = "error";
    return;
  }

  // Mostrar carregamento
  msg.textContent = "⏳ Consultando... Aguarde.";
  msg.className = "loading";

  try {
    // Chamar o Google Apps Script (backend)
    const response = await fetch(`${API_URL}?key=${encodeURIComponent(chave)}`);
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Limpar mensagem
    msg.textContent = "";
    msg.className = "";

    // Verificar se há dados
    if (data.error) {
      msg.textContent = `❌ ${data.message}`;
      msg.className = "error";
      return;
    }

    if (!data.response_data || data.response_data.length === 0) {
      msg.textContent = "❌ NF-e não encontrada ou chave inválida.";
      msg.className = "error";
      return;
    }

    // Sucesso!
    msg.textContent = "✅ Consulta realizada com sucesso!";
    msg.className = "success";
    
    // Exibir dados após pequeno delay
    setTimeout(() => {
      msg.textContent = "";
      msg.className = "";
      exibirDadosNFE(data.response_data[0].Documento);
    }, 1500);

  } catch (error) {
    console.error("Erro na consulta:", error);
    msg.textContent = `❌ Erro ao consultar: ${error.message}`;
    msg.className = "error";
  }
}

// Função para exibir os dados da NFE
function exibirDadosNFE(doc) {
  const tabelas = document.getElementById("tabelas");
  
  if (!doc) {
    tabelas.innerHTML = "<p style='color: #b91c1c;'>📄 Dados da NF-e não disponíveis.</p>";
    return;
  }

  // Informações principais
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
          <span style="color: ${getStatusColor(doc.Status)}; font-weight: bold;">
            ${doc.Status || 'Não informado'}
          </span>
          ${doc.DescricaoStatus ? ` - ${doc.DescricaoStatus}` : ''}
        </td>
      </tr>
  `;
  
  // Informações de transporte (se existirem)
  if (doc.Motorista && doc.Motorista !== 'Não informado') {
    html += `<tr><th>👤 Motorista</th><td>${doc.Motorista}</td></tr>`;
  }
  
  if (doc.Placa && doc.Placa !== 'Não informado') {
    html += `<tr><th>🚚 Placa do Veículo</th><td>${doc.Placa}</td></tr>`;
  }
  
  if (doc.Rota && doc.Rota !== 'Não informado') {
    html += `<tr><th>🗺️ Rota</th><td>${doc.Rota}</td></tr>`;
  }
  
  // Link de rastreamento (se existir)
  if (doc.LinkTracking) {
    html += `
      <tr>
        <th>🔗 Rastreamento</th>
        <td>
          <a href="${doc.LinkTracking}" target="_blank" rel="noopener noreferrer"
             style="background: linear-gradient(135deg, #f97316, #ea580c); 
                    color: white; padding: 10px 20px; border-radius: 8px; 
                    text-decoration: none; font-weight: bold; display: inline-block;
                    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);">
            📍 ACESSAR RASTREAMENTO
          </a>
        </td>
      </tr>
    `;
  }

  // Informações da consulta
  html += `
      <tr>
        <th>📅 Data/Hora da Consulta</th>
        <td>${new Date().toLocaleString('pt-BR')}</td>
      </tr>
      <tr>
        <th>🔑 Chave NF-e Consultada</th>
        <td style="font-family: 'Courier New', monospace; font-size: 12px; color: #666; word-break: break-all;">
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
            <th style="text-align: center;">Qtd.</th>
            <th style="text-align: right;">Valor Unitário</th>
            <th style="text-align: right;">Valor Total</th>
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
        <tr style="background: linear-gradient(135deg, #1e40af, #1e3a8a); color: white; font-weight: bold;">
          <td colspan="4" style="text-align: right; padding: 14px; font-size: 16px;">
            💰 TOTAL GERAL:
          </td>
          <td style="text-align: right; padding: 14px; font-size: 18px;">
            R$ ${totalGeral.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
    `;
  }
  
  // Botão para nova consulta
  html += `
    <div style="margin-top: 40px; text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px;">
      <p style="margin-bottom: 15px; color: #666;">Deseja consultar outra NF-e?</p>
      <button onclick="novaConsulta()" 
              style="background: linear-gradient(135deg, #4f46e5, #3730a3); 
                     color: white; border: none; padding: 14px 28px; 
                     border-radius: 8px; cursor: pointer; font-weight: bold; 
                     font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
        🔄 FAZER NOVA CONSULTA
      </button>
    </div>
  `;

  tabelas.innerHTML = html;
  
  // Rolagem suave para os resultados
  tabelas.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Função para determinar cor do status
function getStatusColor(status) {
  if (!status) return '#666';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('entregue') || statusLower.includes('concluído') || statusLower.includes('finalizado')) {
    return '#16a34a'; // Verde
  } else if (statusLower.includes('transito') || statusLower.includes('transporte') || statusLower.includes('rota')) {
    return '#f59e0b'; // Amarelo
  } else if (statusLower.includes('pendente') || statusLower.includes('aguardando') || statusLower.includes('processando')) {
    return '#f97316'; // Laranja
  } else if (statusLower.includes('cancelado') || statusLower.includes('problema') || statusLower.includes('erro')) {
    return '#dc2626'; // Vermelho
  } else {
    return '#4f46e5'; // Roxo
  }
}

// Função para nova consulta
function novaConsulta() {
  document.getElementById("chave").value = "";
  document.getElementById("tabelas").innerHTML = "";
  document.getElementById("mensagem").textContent = "";
  document.getElementById("mensagem").className = "";
  document.getElementById("chave").focus();
  
  // Mensagem amigável
  const msg = document.getElementById("mensagem");
  msg.textContent = "✍️ Digite uma nova chave NF-e para consultar.";
  msg.className = "";
}
