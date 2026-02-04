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
  if (!chave || chave.length !== 44 || !/^\d+$/.test(chave)) {
    msg.textContent = "Digite uma chave NF-e válida (44 dígitos).";
    return;
  }

  msg.textContent = "Consultando...";
  msg.style.color = "#f97316";

  try {
    // USANDO PROXY QUE FUNCIONA NO GITHUB PAGES
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const apiUrl = `https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${encodeURIComponent(chave)}`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
    
    if (!response.ok) throw new Error('Erro no proxy');
    
    const data = await response.json();
    
    // Verificar resposta
    if (data.error) {
      msg.textContent = data.message;
      return;
    }

    if (!data.response_data || data.response_data.length === 0) {
      msg.textContent = "NF-e não encontrada.";
      return;
    }

    // Sucesso!
    msg.textContent = "";
    const doc = data.response_data[0].Documento;
    
    // Mostrar dados
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
    
    if (doc.LinkTracking) {
      html += `<tr><th>Rastreamento</th><td><a href="${doc.LinkTracking}" target="_blank">Abrir</a></td></tr>`;
    }
    
    html += `</table>`;
    tabelas.innerHTML = html;

  } catch (error) {
    msg.textContent = "Erro na consulta. Tente novamente.";
    console.error(error);
  }
}
