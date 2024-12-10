import React, { useState } from 'react';

const Processo = () => {
  const [areas, setAreas] = useState([]); // Estado para armazenar as áreas
  const [loading, setLoading] = useState(false); // Estado para gerenciar o carregamento
  const [error, setError] = useState(null); // Estado para gerenciar erros

  const fetchProcessoData = async () => {
    const endpoint = `https://firestore.googleapis.com/v1/projects/teste-ad0e8/databases/(default)/documents/processos/PSSP2025`;

    setLoading(true); // Ativar o carregamento
    setError(null); // Limpar erros anteriores

    try {
      const response = await fetch(endpoint);

      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos do Firestore:', data);

        // Extrair e processar as áreas
        const areasData = data.fields.areas.arrayValue.values.map((item) => ({
          faculdade: item.mapValue.fields.faculdade.stringValue,
          area: item.mapValue.fields.area.stringValue,
          pontosSorteados:
            item.mapValue.fields.pontosSorteados.arrayValue.values,
          pontos: item.mapValue.fields.pontos.arrayValue.values.map(
            (ponto) => ponto.stringValue
          ),
        }));

        setAreas(areasData); // Atualizar o estado com os dados recebidos
        console.log(areasData);
      } else {
        setError('Erro ao buscar os dados.');
        console.error('Erro ao buscar os dados:', response.statusText);
      }
    } catch (error) {
      setError('Erro ao fazer a requisição.');
      console.error('Erro ao fazer a requisição:', error);
    } finally {
      setLoading(false); // Desativar o carregamento
    }
  };

  return (
    <div>
      <h1>Processo: tese</h1>

      {/* Botão para carregar os dados */}
      <button onClick={fetchProcessoData} disabled={loading}>
        {loading ? 'Carregando...' : 'Carregar Dados'}
      </button>

      {/* Exibir mensagem de erro, se houver */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Tabela de áreas */}
      {areas.length > 0 && (
        <table border="1">
          <thead>
            <tr>
              <th>Faculdade</th>
              <th>Área</th>
              <th>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area, index) => (
              <tr key={index}>
                <td>{area.faculdade}</td>
                <td>{area.area}</td>
                <td>{area.pontos.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Processo;
