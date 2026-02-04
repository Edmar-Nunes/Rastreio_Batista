document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("send").addEventListener("click", async () => {
    await consultarNFE();
  });

  // Permitir pressionar Enter para consultar
  document.getElementById("chave").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      consultarNFE();
    }
  });
});

async function consultarNFE() {
  const chave = document.getElementById("chave").value.trim();
  const msg = document.getElementById("mensagem");
  const tabelas = document.getElementById("tabelas");

  tabelas.innerHTML = "";
  msg.textContent = "";

  if (!chave) {
    msg.textContent = "Digite uma chave de NF-e válida.";
    return;
  }

  // Validação básica da chave (44 dígitos)
  if (chave.length !== 44 || !/^\d+$/.test(chave)) {
    msg.textContent = "Formato inválido. A chave NF-e deve ter 44 dígitos numéricos.";
    return;
  }

  msg.textContent = "Consultando...";
  msg.style.color = "#f97316"; // Cor laranja para mensagem de processamento

  try {
    // URL da API (mantida igual ao original)
    const url = `https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${encodeURIComponent(chave)}`;
    
    // Opções da requisição
    const options = {
      method: "GET",
      headers: {
        "Authorization": "Basic dGJhdGlzdGE6R0VaV3VEZ3ZQUHVpdmpCZENick9aNUNsT2NuS2xGdTk=",
        "Content-Type": "application/json"
      }
    };

    // Fazendo a requisição diretamente à API
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Limpar mensagem
    msg.textContent = "";
    msg.style.color = "#b91c1c"; // Voltar para cor vermelha padrão

    // Verificar se há dados
    if (!data.response_data || data.response_data.length === 0) {
      msg.textContent = "NF-e não encontrada ou chave inválida.";
      return;
    }

    const doc = data.response_data[0].Documento;
    
    // Verificar se o documento existe
    if (!doc) {
      msg.textContent = "Dados da NF-e não disponíveis.";
      return;
    }

    // Informações principais (sem itens)
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
    
    // Adicionar link de rastreamento se existir
    if (doc.LinkTracking) {
      html += `<tr><th>Rastreamento do Pedido</th><td><a href="${doc.LinkTracking}" target="_blank" rel="noopener noreferrer">Abrir</a></td></tr>`;
    } else {
      html += `<tr><th>Rastreamento do Pedido</th><td>Não disponível</td></tr>`;
    }
    
    html += `</table>`;
    
    // Adicionar informações de itens se existirem
    if (doc.Items && doc.Items.length > 0) {
      html += `
        <div class="title-section">Itens da Nota</div>
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
      
      doc.Items.forEach(item => {
        html += `
          <tr>
            <td>${item.Codigo || ''}</td>
            <td>${item.Descricao || ''}</td>
            <td>${item.Qtde || 0}</td>
            <td>R$ ${parseFloat(item.VlUnitario || 0).toFixed(2)}</td>
            <td>R$ ${parseFloat(item.VlTotal || 0).toFixed(2)}</td>
          </tr>
        `;
      });
      
      html += `</tbody></table>`;
    }

    tabelas.innerHTML = html;

  } catch (error) {
    console.error("Erro na consulta:", error);
    msg.textContent = `Erro ao consultar: ${error.message}`;
    msg.style.color = "#b91c1c";
  }
}
