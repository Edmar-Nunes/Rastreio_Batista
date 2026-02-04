// Função que funciona no GitHub Pages
async function consultarNFEGitHub() {
  const chave = document.getElementById("chave").value.trim();
  const msg = document.getElementById("mensagem");
  const tabelas = document.getElementById("tabelas");

  // Limpar
  tabelas.innerHTML = "";
  msg.textContent = "";
  msg.style.color = "#b91c1c";

  // Validar
  if (!chave || chave.length !== 44 || !/^\d+$/.test(chave)) {
    msg.textContent = "Digite uma chave válida (44 dígitos).";
    return;
  }

  msg.textContent = "Consultando...";
  msg.style.color = "#f97316";

  try {
    // Método 1: Usar proxy CORS que funciona
    const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
    const apiUrl = `https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${chave}`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
      headers: {
        'Authorization': 'Basic dGJhdGlzdGE6R0VaV3VEZ3ZQUHVpdmpCZENick9aNUNsT2NuS2xGdTk=',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erro no servidor');
    }

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Tentar método alternativo se falhar
      data = await tentarMetodoAlternativo(chave);
    }

    // Processar resposta
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
    exibirDadosNFE(data.response_data[0].Documento);

  } catch (error) {
    console.error("Erro:", error);
    msg.textContent = "Tentando método alternativo...";
    
    // Tentar método alternativo
    try {
      const data = await tentarMetodoAlternativo(chave);
      
      if (data.error) {
        msg.textContent = data.message;
        return;
      }
      
      if (!data.response_data || data.response_data.length === 0) {
        msg.textContent = "NF-e não encontrada.";
        return;
      }
      
      msg.textContent = "";
      exibirDadosNFE(data.response_data[0].Documento);
      
    } catch (error2) {
      msg.textContent = `Use uma extensão de CORS no navegador. Erro: ${error2.message}`;
    }
  }
}

// Método alternativo
async function tentarMetodoAlternativo(chave) {
  try {
    // Outro proxy
    const proxyUrl = 'https://thingproxy.freeboard.io/fetch/';
    const apiUrl = `https://api.comprovei.com.br/api/1.1/documents/getStatus?key=${chave}`;
    
    const response = await fetch(proxyUrl + apiUrl, {
      headers: {
        'Authorization': 'Basic dGJhdGlzdGE6R0VaV3VEZ3ZQUHVpdmpCZENick9aNUNsT2NuS2xGdTk='
      }
    });
    
    return await response.json();
  } catch (e) {
    throw e;
  }
}

// Exibir dados
function exibirDadosNFE(doc) {
  const tabelas = document.getElementById("tabelas");
  
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
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("send").addEventListener("click", consultarNFEGitHub);
  document.getElementById("chave").addEventListener("keypress", function(e) {
    if (e.key === "Enter") consultarNFEGitHub();
  });
});
