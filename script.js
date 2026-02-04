document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById("send");
  const chaveInput = document.getElementById("chave");
  
  sendBtn.addEventListener("click", consultarNFE);
  
  chaveInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") consultarNFE();
  });
  
  // Focar no input
  chaveInput.focus();
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
    msg.textContent = "Formato inválido. A chave deve ter 44 dígitos numéricos.";
    return;
  }

  // Mostrar carregamento
  msg.textContent = "Consultando...";
  msg.style.color = "#f97316";

  try {
    // IMPORTANTE: Usando Netlify Function
    const response = await fetch(`/.netlify/functions/rastrear?key=${encodeURIComponent(chave)}`);
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar resposta
    if (data.error) {
      msg.textContent = data.message;
      return;
    }

    if (!data.response_data || data.response_data.length === 0) {
      msg.textContent = "NF-e não encontrada ou chave inválida.";
      return;
    }

    // Sucesso!
    msg.textContent = "";
    exibirDadosNFE(data.response_data[0].Documento);
    
  } catch (error) {
    console.error("Erro:", error);
    msg.textContent = `Erro na consulta: ${error.message}`;
  }
}

function exibirDadosNFE(doc) {
  const tabelas = document.getElementById("tabelas");
  
  if (!doc) {
    tabelas.innerHTML = "<p style='color: #b91c1c;'>Dados da NF-e não disponíveis.</p>";
    return;
  }

  let html = `
    <div class="title-section">📋 Informações da Nota Fiscal</div>
    <table>
      <tr><th>Nome/Razão Social</th><td>${doc.Nome || 'Não informado'}</td></tr>
      <tr><th>Cidade/Estado</th><td>${doc.Cidade || 'Não informada'} - ${doc.Estado || 'Não informado'}</td></tr>
      <tr><th>Status</th><td><strong>${doc.Status || 'N/A'}</strong> - ${doc.DescricaoStatus || 'Não informado'}</td></tr>
  `;
  
  if (doc.Motorista && doc.Motorista !== 'Não informado') {
    html += `<tr><th>Motorista</th><td>${doc.Motorista}</td></tr>`;
  }
  
  if (doc.Placa && doc.Placa !== 'Não informado') {
    html += `<tr><th>Placa do Veículo</th><td>${doc.Placa}</td></tr>`;
  }
  
  if (doc.Rota && doc.Rota !== 'Não informado') {
    html += `<tr><th>Rota</th><td>${doc.Rota}</td></tr>`;
  }
  
  if (doc.LinkTracking) {
    html += `<tr><th>🔗 Rastreamento</th><td><a href="${doc.LinkTracking}" target="_blank" style="color: #f97316; font-weight: 600;">Abrir página de rastreamento</a></td></tr>`;
  }
  
  // Data da consulta
  html += `
    <tr><th>Data da Consulta</th><td>${new Date().toLocaleString('pt-BR')}</td></tr>
    <tr><th>Chave Consultada</th><td style="font-family: monospace; font-size: 13px;">${document.getElementById("chave").value}</td></tr>
  </table>`;
  
  // Itens da nota (se existir)
  if (doc.Items && doc.Items.length > 0) {
    html += `
      <div class="title-section" style="margin-top: 30px;">🛒 Itens da Nota</div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Quantidade</th>
            <th>Valor Unit.</th>
            <th>Valor Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    let totalGeral = 0;
    doc.Items.forEach(item => {
      const qtd = item.Qtde || 0;
      const unit = parseFloat(item.VlUnitario || 0);
      const total = parseFloat(item.VlTotal || 0);
      totalGeral += total;
      
      html += `
        <tr>
          <td>${item.Codigo || ''}</td>
          <td>${item.Descricao || ''}</td>
          <td>${qtd}</td>
          <td>R$ ${unit.toFixed(2)}</td>
          <td>R$ ${total.toFixed(2)}</td>
        </tr>
      `;
    });
    
    html += `
        <tr style="background: #f8fafc; font-weight: bold;">
          <td colspan="4" style="text-align: right;">TOTAL GERAL:</td>
          <td>R$ ${totalGeral.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>`;
  }
  
  tabelas.innerHTML = html;
  
  // Rolagem suave para resultados
  tabelas.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
