import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import './index.css';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  const [processos, setProcessos] = useState([]);
  const [selectedProcesso, setSelectedProcesso] = useState('');
  const [novoProcesso, setNovoProcesso] = useState('');
  const [areasData, setAreasData] = useState({});
  const [formData, setFormData] = useState({
    faculdade: '',
    area: '',
    pontosSorteados: [],
    pontos: [''],
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [areasCount, setAreasCount] = useState(0); // Contador de áreas

  // Carregar processos ao montar o componente
  useEffect(() => {
    const fetchProcessos = async () => {
      const querySnapshot = await getDocs(collection(db, 'processos'));
      const loadedProcessos = [];
      const loadedAreasData = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedProcessos.push(data.nome);
        loadedAreasData[data.nome] = data.areas || [];
      });
      setProcessos(loadedProcessos);
      setAreasData(loadedAreasData);
    };

    fetchProcessos();
  }, []);

  useEffect(() => {
    // Atualiza o contador de áreas quando o processo selecionado mudar ou as áreas forem atualizadas
    if (selectedProcesso) {
      setAreasCount(areasData[selectedProcesso]?.length || 0);
    }
  }, [selectedProcesso, areasData]);

  const handleCreateProcesso = async () => {
    if (novoProcesso.trim() === '') return;
    if (!processos.includes(novoProcesso)) {
      const newProcesso = { nome: novoProcesso, areas: [] };
      // Usando o nome do processo como ID no Firestore
      await setDoc(doc(db, 'processos', novoProcesso), newProcesso);
      setProcessos((prev) => [...prev, novoProcesso]);
    }
    setSelectedProcesso(novoProcesso);
    setNovoProcesso('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const addPonto = () => {
    setFormData((prevData) => ({
      ...prevData,
      pontos: [...prevData.pontos, ''],
    }));
  };

  const handlePontoChange = (index, value) => {
    const updatedPontos = [...formData.pontos];
    updatedPontos[index] = value;
    setFormData((prevData) => ({
      ...prevData,
      pontos: updatedPontos,
    }));
  };

  const removePonto = (index) => {
    const updatedPontos = formData.pontos.filter((_, i) => i !== index);
    setFormData((prevData) => ({
      ...prevData,
      pontos: updatedPontos,
    }));
  };

  const handleSave = async () => {
    if (!selectedProcesso) {
      alert('Selecione ou crie um processo antes de salvar os dados.');
      return;
    }

    const processoAreas = areasData[selectedProcesso] || [];
    const updatedAreas = [...processoAreas];

    if (editingIndex !== null) {
      updatedAreas[editingIndex] = formData;
    } else {
      updatedAreas.push(formData);
    }

    const docRef = (await getDocs(collection(db, 'processos'))).docs.find(
      (doc) => doc.data().nome === selectedProcesso
    );

    if (docRef) {
      await updateDoc(doc(db, 'processos', docRef.id), { areas: updatedAreas });
    }

    setAreasData((prevData) => ({
      ...prevData,
      [selectedProcesso]: updatedAreas,
    }));

    setFormData({
      faculdade: '',
      area: '',
      pontosSorteados: [],
      pontos: [''],
    });
    setEditingIndex(null);
  };

  const handleEdit = (index) => {
    const dataToEdit = areasData[selectedProcesso][index];
    setFormData(dataToEdit);
    setEditingIndex(index);
  };

  const handleRemove = async (index) => {
    const processoAreas = areasData[selectedProcesso] || [];
    const updatedAreas = processoAreas.filter((_, i) => i !== index);

    const docRef = (await getDocs(collection(db, 'processos'))).docs.find(
      (doc) => doc.data().nome === selectedProcesso
    );

    if (docRef) {
      await updateDoc(doc(db, 'processos', docRef.id), { areas: updatedAreas });
    }

    setAreasData((prevData) => ({
      ...prevData,
      [selectedProcesso]: updatedAreas,
    }));
  };

  // Função para atualizar o endpoint 'sorteio' com o processo selecionado
  const handleUtilizar = async () => {
    if (!selectedProcesso) {
      alert('Selecione um processo antes de utilizar!');
      return;
    }

    const processoAreas = areasData[selectedProcesso] || [];

    // Supondo que você deseje atualizar os dados de sorteio no Firestore
    const sorteioRef = doc(db, 'processos', 'sorteio'); // Referência ao documento 'sorteio'

    try {
      await setDoc(sorteioRef, {
        areas: processoAreas, // Atualiza as áreas do sorteio com as áreas do processo selecionado
      });
      alert('Sorteio atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar sorteio:', error);
      alert('Erro ao atualizar sorteio!');
    }
  };
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">
        Gerenciador de Áreas por Processo
      </h1>

      {/* Processo */}
      <div className="mb-6">
        <h3 className="mb-2 font-semibold">Selecione ou Crie um Processo</h3>
        <div className="flex items-center gap-4">
          <select
            value={selectedProcesso}
            onChange={(e) => setSelectedProcesso(e.target.value)}
            className="w-64 rounded border border-gray-300 p-2"
          >
            <option value="">Selecione um Processo</option>
            {processos.map((processo, index) => (
              <option key={index} value={processo}>
                {processo}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={novoProcesso}
            onChange={(e) => setNovoProcesso(e.target.value)}
            placeholder="Novo Processo"
            className="w-64 rounded border border-gray-300 p-2"
          />
          <button
            onClick={handleCreateProcesso}
            className="rounded bg-blue-500 px-4 py-2 text-white"
          >
            Criar Processo
          </button>
        </div>
      </div>

      {/* Botão "UTILIZAR" */}
      {selectedProcesso && (
        <div className="mb-6">
          <button
            onClick={handleUtilizar}
            className="rounded bg-green-500 px-4 py-2 text-white"
          >
            UTILIZAR
          </button>
        </div>
      )}

      {/* Contador de Áreas */}
      {selectedProcesso && (
        <div className="mb-6">
          <p>
            <strong>Contagem de Áreas:</strong> {areasCount}
          </p>
        </div>
      )}

      {/* Formulário */}
      {selectedProcesso && (
        <div className="mb-6">
          <h3 className="mb-4 text-center text-2xl font-semibold">
            {editingIndex !== null ? 'Editar Dados' : 'Adicionar Dados'} -
            Processo: {selectedProcesso}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block font-medium">Área:</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full rounded border border-gray-300 p-2"
              />
            </div>
            <div>
              <label className="block font-medium">Faculdade:</label>
              <input
                type="text"
                name="faculdade"
                value={formData.faculdade}
                onChange={handleInputChange}
                className="w-full rounded border border-gray-300 p-2"
              />
            </div>
          </div>
          <h3 className="mt-4 font-semibold">Pontos:</h3>
          {formData.pontos.map((ponto, index) => (
            <div key={index} className="mb-2 flex items-center gap-4">
              <input
                type="text"
                value={ponto}
                onChange={(e) => handlePontoChange(index, e.target.value)}
                className="flex-1 rounded border border-gray-300 p-2"
              />
              <button
                onClick={() => removePonto(index)}
                className="rounded bg-red-500 px-4 py-2 text-white"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            onClick={addPonto}
            className="mt-2 rounded bg-green-500 px-4 py-2 text-white"
          >
            Adicionar Ponto
          </button>
          <button
            onClick={handleSave}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
          >
            {editingIndex !== null ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Dados Salvos */}
      {selectedProcesso && areasData[selectedProcesso] && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Dados Salvos</h2>
          <ul className="space-y-4">
            {areasData[selectedProcesso].map((data, index) => (
              <li key={index} className="rounded bg-gray-100 p-4 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Área:</strong> {data.area}
                    <br />
                    <strong>Faculdade:</strong> {data.faculdade} <br />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleEdit(index)}
                      className="rounded bg-yellow-500 px-4 py-2 text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemove(index)}
                      className="rounded bg-red-500 px-4 py-2 text-white"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium">Pontos:</h4>
                  <ul className="ml-6 list-disc">
                    {data.pontos.map((ponto, i) => (
                      <li key={i}>{ponto}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
