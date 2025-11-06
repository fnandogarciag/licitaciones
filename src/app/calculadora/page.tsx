'use client';
import React, { useState } from 'react';
import '../globals.css';
import SMMLV, {
  SMMLV_ACTUAL,
  Salarios,
} from '@/components/common/SalarioMinimoColombia';

// Utilidades
const isValidYear = (year: string) => {
  const n = Number(year);
  return n >= 2000 && n <= 2025;
};
const isValidValue = (val: string) => val !== '';
const isValidPercent = (val: string) => {
  const n = Number(val);
  return n >= 0 && n <= 100;
};
const formatNumber = (val: string) =>
  val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export default function CalculadoraPage() {
  // --- Utilidades de validación y formato ---

  const [inputs, setInputs] = useState({
    año: '',
    valor: '',
    porcentaje: '',
    proceso: '',
    select: '75',
  });
  const [errors, setErrors] = useState({
    año: '',
    valor: '',
    porcentaje: '',
  });
  const [resultados, setResultados] = useState({
    valor_smmlv: 0,
    valor_pesos: 0,
    afectado: 0,
    proceso_smmlv: 0,
    porcentajes: [0, 0, 0],
    importantes: [0, 0, 0],
  });

  // Hoisted function: calcularTercerCuadro debe declararse antes de usarla
  const calcularTercerCuadro = (valorSeleccionado: number) => {
    const porcentajes = [75, 120, 150];
    const idx = porcentajes.indexOf(valorSeleccionado);
    if (idx !== -1) {
      setResultados((r) => ({
        ...r,
        importantes: [0.05, 0.4, 0.5].map((p) => r.porcentajes[idx] * p),
      }));
    }
  };

  // Calcular factores importantes al cargar
  React.useEffect(() => {
    calcularTercerCuadro(75);
  }, []);
  // --- Manejo de inputs y validaciones ---

  // Handlers
  const handleInput = (field: string, value: string) => {
    let v = value;
    if (field === 'valor' || field === 'proceso') v = formatNumber(value);
    if (field === 'proceso') {
      setInputs((prev) => {
        const newInputs = { ...prev, [field]: v };
        const procesoNum = Number(v.replace(/\./g, ''));
        if (isValidValue(v) && procesoNum >= SMMLV_ACTUAL) {
          setTimeout(() => calcularSegundoCuadro(v), 0);
        } else {
          setResultados((r) => ({
            ...r,
            proceso_smmlv: 0,
            porcentajes: [0, 0, 0],
            importantes: [0, 0, 0],
          }));
        }
        return newInputs;
      });
    } else {
      setInputs((prev) => ({ ...prev, [field]: v }));
    }
    // Validaciones
    if (field === 'año')
      setErrors((prev) => ({
        ...prev,
        año: isValidYear(v) ? '' : 'Elige año entre 2000 y 2025',
      }));
    if (field === 'porcentaje')
      setErrors((prev) => ({
        ...prev,
        porcentaje: isValidPercent(v) ? '' : 'Porcentaje inválido',
      }));
    if (field === 'valor') {
      let errorMsg = '';
      if (!isValidValue(v)) {
        errorMsg = 'Valor requerido';
      } else if (isValidYear(inputs.año)) {
        const valorNum = Number(v.replace(/\./g, ''));
        const smmlvAño = SMMLV(Number(inputs.año));
        if (valorNum < smmlvAño) {
          errorMsg = `El valor debe ser mayor o igual a $${smmlvAño.toLocaleString(
            'es-CO',
          )}`;
        }
      }
      setErrors((prev) => ({
        ...prev,
        valor: errorMsg,
      }));
    }

    // Cálculo automático para el primer cuadro
    if (
      (field === 'año' &&
        isValidYear(v) &&
        isValidValue(inputs.valor) &&
        isValidPercent(inputs.porcentaje)) ||
      (field === 'valor' &&
        isValidYear(inputs.año) &&
        isValidValue(v) &&
        isValidPercent(inputs.porcentaje)) ||
      (field === 'porcentaje' &&
        isValidYear(inputs.año) &&
        isValidValue(inputs.valor) &&
        isValidPercent(v))
    ) {
      const año = field === 'año' ? v : inputs.año;
      const valor = field === 'valor' ? v : inputs.valor;
      const porcentaje = field === 'porcentaje' ? v : inputs.porcentaje;
      const valorContratoNum = Number(valor.replace(/\./g, ''));
      const añoTerminacionNum = Number(año);
      const porcentajeParticipacionNum = Number(porcentaje);
      const valor_smmlv = valorContratoNum / SMMLV(añoTerminacionNum);
      setResultados((r) => ({
        ...r,
        valor_smmlv,
        valor_pesos: valor_smmlv * SMMLV_ACTUAL,
        afectado: valor_smmlv * (porcentajeParticipacionNum / 100),
      }));
    }
  };

  // Cálculos
  const calcularSegundoCuadro = (procesoStr?: string) => {
    const procesoValue = procesoStr !== undefined ? procesoStr : inputs.proceso;
    const vlrProcesoNum = Number(procesoValue.replace(/\./g, ''));
    const proceso_smmlv = vlrProcesoNum / SMMLV_ACTUAL;
    const porcentajes = [0.75, 1.2, 1.5].map((p) => proceso_smmlv * p);
    setResultados((r) => {
      const newResultados = { ...r, proceso_smmlv, porcentajes };
      const porcentajesOpciones = [75, 120, 150];
      const idx = porcentajesOpciones.indexOf(Number(inputs.select));
      if (idx !== -1) {
        newResultados.importantes = [0.05, 0.4, 0.5].map(
          (p) => porcentajes[idx] * p,
        );
      } else {
        newResultados.importantes = [0, 0, 0];
      }
      return newResultados;
    });
  };
  // Salarios ya importado arriba

  return (
    <div className="min-h-screen flex flex-row items-start justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      {/* Tabla de salarios a la izquierda */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-2 inline-block self-start ml-40 mt-12">
        <h2 className="text-base font-semibold text-white mb-2 text-center">
          SMMLV POR AÑO
        </h2>
        <div className="overflow-x-auto">
          <table
            className="border border-white/30 rounded-lg"
            style={{ tableLayout: 'auto', minWidth: '1px' }}
          >
            <thead>
              <tr>
                <th
                  className="border px-1 py-0.5 text-white/90 whitespace-nowrap"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                >
                  Año
                </th>
                <th
                  className="border px-1 py-0.5 text-white/90 whitespace-nowrap"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                >
                  SMMLV ($)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ...Object.entries(Salarios)
                  .filter(([año]) => Number(año) >= 2000 && Number(año) <= 2025)
                  .sort((a, b) => Number(b[0]) - Number(a[0])),
              ].map(([año, valor]) => (
                <tr key={año}>
                  <td
                    className="border px-1 py-0.5 text-white/80 text-center whitespace-nowrap"
                    style={{ fontSize: '1.15rem', fontWeight: 500 }}
                  >
                    {año}
                  </td>
                  <td
                    className="border px-1 py-0.5 text-white/80 text-right whitespace-nowrap"
                    style={{ fontSize: '1.15rem', fontWeight: 500 }}
                  >
                    {Number(valor).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Cuadros centrados */}
      <div className="flex flex-col items-center justify-center max-w-3xl gap-8 mx-auto mt-12">
        {/* Primer cuadro */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-10 flex flex-col items-center w-full mb-0">
          <h1 className="text-3xl font-bold text-white mb-8">
            VALOR DE EXPERIENCIA PARA PARTICIPAR EN SMMLV
          </h1>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 w-full justify-center items-stretch">
            {/* Fila 1: instertar año terminacion */}
            <span className="text-white/80 text-lg self-center text-center">
              INSERTAR AÑO TERMINACIÓN
            </span>
            <div className="flex flex-col">
              <input
                type="number"
                min="2000"
                max="2025"
                required
                value={inputs.año}
                onChange={(e) => {
                  if (e.target.value.length <= 4)
                    handleInput('año', e.target.value);
                }}
                className="no-spinner bg-white/20 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white text-center"
                maxLength={4}
                style={{ width: '70px' }}
              />
              {errors.año && (
                <span className="text-red-500 text-sm mt-1">{errors.año}</span>
              )}
            </div>
            {/* Fila 2: Valor del contrato */}
            <span className="text-white/80 text-lg self-center text-center">
              INSERTAR VALOR DEL CONTRATO
            </span>
            <div className="flex flex-col">
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/80">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9.]*"
                  required
                  value={inputs.valor}
                  onChange={(e) => {
                    if (e.target.value.replace(/\D/g, '').length <= 20)
                      handleInput('valor', e.target.value);
                  }}
                  className={`no-spinner bg-white/20 text-white pl-6 pr-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white${
                    errors.valor ? ' border-red-500' : ''
                  }`}
                  maxLength={20}
                />
              </div>
              {errors.valor && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.valor}
                </span>
              )}
            </div>
            {/* Fila 3: % participación del contrato*/}
            <span className="text-white/80 text-lg self-center text-center">
              INSERTAR % DE PARTICIPACIÓN DEL CONTRATO
            </span>
            <div className="flex flex-col relative" style={{ width: '90px' }}>
              <input
                type="text"
                inputMode="decimal"
                pattern="^\d{0,3}([\.,]\d{0,2})?$"
                required
                value={inputs.porcentaje.replace('.', ',')}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^\d.,]/g, '');
                  val = val.replace(',', '.');
                  if (/^\d{0,3}(\.\d{0,2})?$/.test(val))
                    handleInput('porcentaje', val);
                }}
                className="no-spinner bg-white/20 text-white px-3 py-2 pr-8 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white w-full text-center"
                style={{ width: '100px', verticalAlign: 'middle' }}
                maxLength={6}
              />
              <span
                className="absolute text-white/80"
                style={{ right: '10px', top: '8px', pointerEvents: 'none' }}
              >
                %
              </span>
              {errors.porcentaje && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.porcentaje}
                </span>
              )}
            </div>
            {/* Resultados */}
            <span className="text-white/80 text-lg self-center text-center">
              VALOR EN SMMLV
            </span>
            <span className="text-white/80 text-lg">
              {isValidYear(inputs.año) &&
              isValidValue(inputs.valor) &&
              isValidPercent(inputs.porcentaje) &&
              !errors.valor &&
              !errors.año &&
              !errors.porcentaje
                ? Number(resultados.valor_smmlv).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })
                : '0'}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              VALOR ACTUAL EN PESOS
            </span>
            <span className="text-white/80 text-lg">
              {isValidYear(inputs.año) &&
              isValidValue(inputs.valor) &&
              isValidPercent(inputs.porcentaje) &&
              !errors.valor &&
              !errors.año &&
              !errors.porcentaje
                ? `$${Number(resultados.valor_pesos).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}`
                : '$0'}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              SMMLV AFECTADO POR % PARTICIPACIÓN
            </span>
            <span className="text-white/80 text-lg">
              {isValidYear(inputs.año) &&
              isValidValue(inputs.valor) &&
              isValidPercent(inputs.porcentaje) &&
              !errors.valor &&
              !errors.año &&
              !errors.porcentaje
                ? Number(resultados.afectado).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })
                : '0'}
            </span>
          </div>
        </div>
        {/* Segundo cuadro */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 flex flex-col items-center w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            VLR PROCESO EN SMMLV
          </h2>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 w-full justify-center items-stretch">
            {/* Fila 1: insertar VLR PROCESO */}
            <span className="text-white/80 text-lg self-center text-center">
              INSERTAR VLR PROCESO
            </span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/80">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={inputs.proceso}
                onChange={(e) => {
                  if (e.target.value.replace(/\D/g, '').length <= 20)
                    handleInput('proceso', e.target.value);
                }}
                className="no-spinner bg-white/20 text-white pl-6 pr-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white w-full mt-4"
                maxLength={20}
                style={{ minWidth: '180px' }}
              />
              {isValidValue(inputs.proceso) &&
                Number(inputs.proceso.replace(/\./g, '')) < SMMLV_ACTUAL && (
                  <span
                    className="text-red-500 text-sm block absolute left-0 w-full mt-1"
                    style={{ top: '100%' }}
                  >
                    Elige un valor mayor o igual a $
                    {SMMLV_ACTUAL.toLocaleString('es-CO')}
                  </span>
                )}
              <span
                style={{
                  visibility: 'hidden',
                  height: '20px',
                  display: 'block',
                  width: '100%',
                }}
              >
                Elige un valor mayor o igual a $
                {SMMLV_ACTUAL.toLocaleString('es-CO')}
              </span>
            </div>
            {/* Resultados */}
            <span className="text-white/80 text-lg self-center text-center">
              VLR PROCESO EN SMMLV
            </span>
            <span className="text-white/80 text-lg">
              {isValidValue(inputs.proceso) &&
              Number(inputs.proceso.replace(/\./g, '')) >= SMMLV_ACTUAL
                ? Number(resultados.proceso_smmlv).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })
                : '0'}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              75%
            </span>
            <span className="text-white/80 text-lg">
              {isValidValue(inputs.proceso) &&
              Number(inputs.proceso.replace(/\./g, '')) >= SMMLV_ACTUAL
                ? Number(resultados.porcentajes[0]).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })
                : '0'}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              120%
            </span>
            <span className="text-white/80 text-lg">
              {isValidValue(inputs.proceso) &&
              Number(inputs.proceso.replace(/\./g, '')) >= SMMLV_ACTUAL
                ? Number(resultados.porcentajes[1]).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })
                : '0'}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              150%
            </span>
            <span className="text-white/80 text-lg">
              {isValidValue(inputs.proceso) &&
              Number(inputs.proceso.replace(/\./g, '')) >= SMMLV_ACTUAL
                ? Number(resultados.porcentajes[2]).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })
                : '0'}
            </span>
          </div>
        </div>

        {/* Tercer cuadro */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 flex flex-col items-center w-full max-w-2xl mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            FACTORES PONDERABLES SEGUN EXPERIENCIA
          </h2>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 w-full justify-center items-stretch">
            {/* Fila 1: Select porcentaje */}
            <span className="text-white/80 text-lg self-center text-center">
              INSERTAR % SEGUN # DE CONTRATOS
            </span>
            <select
              required
              value={inputs.select}
              onChange={(e) => {
                const valorSeleccionado = Number(e.target.value);
                setInputs((prev) => ({
                  ...prev,
                  select: String(valorSeleccionado),
                }));
                calcularTercerCuadro(valorSeleccionado);
              }}
              className="bg-white/20 text-black px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              style={{ width: '80px' }}
              disabled={resultados.proceso_smmlv <= 0}
            >
              <option value={75}>75%</option>
              <option value={120}>120%</option>
              <option value={150}>150%</option>
            </select>
            {/* Resultados*/}
            <span className="text-white/80 text-lg self-center text-center">
              % IMPORTANTES
            </span>
            <span></span>
            <span className="text-white/80 text-lg self-center text-center">
              5%
            </span>
            <span className="text-white/80 text-lg">
              {Number(resultados.importantes[0]).toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              40%
            </span>
            <span className="text-white/80 text-lg">
              {Number(resultados.importantes[1]).toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </span>
            <span className="text-white/80 text-lg self-center text-center">
              50%
            </span>
            <span className="text-white/80 text-lg">
              {Number(resultados.importantes[2]).toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
