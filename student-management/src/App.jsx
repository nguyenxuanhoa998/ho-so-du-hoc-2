import React, { useState } from 'react';
import Step1Form from './Step1Form';
import Step2Form from './Step2Form';
import Step3View from './Step3View';

function App() {
  const [activeTab, setActiveTab] = useState('step1');

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation Bar */}
      <nav className="flex justify-center gap-2 p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <button 
          onClick={() => setActiveTab('step1')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'step1' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
        >
          BƯỚC 1: HỒ SƠ VIỆT
        </button>
        <button 
          onClick={() => setActiveTab('step2')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'step2' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
        >
          BƯỚC 2: HỒ SƠ ANH
        </button>
        <button 
          onClick={() => setActiveTab('step3')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'step3' ? 'bg-yellow-600 text-slate-900 shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
        >
          BƯỚC 3: TỔNG HỢP
        </button>
      </nav>

      {/* Render Content */}
      <div className="pt-4">
        {activeTab === 'step1' && <Step1Form />}
        {activeTab === 'step2' && <Step2Form />}
        {activeTab === 'step3' && <Step3View />}
      </div>
    </div>
  );
}

export default App;