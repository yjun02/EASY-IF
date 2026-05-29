import React from 'react';
import { Plus } from 'lucide-react';

export default function MealForm({ 
  timeInput, 
  setTimeInput, 
  foodInput, 
  setFoodInput, 
  amountInput, 
  setAmountInput, 
  weightInput, 
  setWeightInput, 
  onSubmit 
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Plus size={18} className="text-green-500" />
        식단 기록하기
      </h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">식사 시간</label>
          <input 
            type="time" 
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">음식 이름 <span className="text-red-400">*</span></label>
          <input 
            type="text" 
            placeholder="예: 바나나 1개, 그릭요거트 200g" 
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            maxLength={30}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder:text-gray-400"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">비고 <span className="text-gray-300 font-medium">(선택)</span></label>
          <input 
            type="text" 
            placeholder="예: 무가당 섭취 / 운동 후 섭취" 
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            maxLength={30}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">체중 <span className="text-gray-300 font-medium">(선택, kg)</span></label>
          <input 
            type="number" 
            step="0.01"
            inputMode="decimal"
            placeholder="예: 65.52 (소숫점 2자리까지 반영)" 
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder:text-gray-400"
          />
        </div>
        <button 
          type="submit" 
          className="bg-green-600 text-white rounded-xl py-4 text-base md:text-lg font-bold mt-1 hover:bg-green-700 transition-colors"
        >
          기록 추가
        </button>
      </form>
    </div>
  );
}
