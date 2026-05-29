import React from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ActiveCycleTimeline({ 
  currentActiveCycle, 
  editingLogId, 
  editForm, 
  setEditForm, 
  onStartEditing, 
  onCancelEditing, 
  onSaveEditing, 
  onDelete 
}) {
  return (
    <div className="flex flex-col h-full mt-4">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">현재 식사 사이클 기록</h2>
          <p className="text-sm text-gray-500 mt-1">최근 식사 시작 기준</p>
        </div>
      </div>

      {/* Timeline View */}
      <div className="flex-1">
        <div className="relative pl-4 border-l-2 border-gray-200 flex flex-col gap-8 pb-8">
          {currentActiveCycle.length === 0 && (
            <div className="text-sm text-gray-400 font-medium py-10 text-center">
              아직 기록된 식단이 없습니다. (현재 공복 중)
            </div>
          )}
          
          {currentActiveCycle.map((log, index) => {
            const isFirst = index === 0;
            const isLast = index === currentActiveCycle.length - 1 && currentActiveCycle.length > 1;
            const isEditing = editingLogId === log.id;
            
            return (
              <div key={log.id} className="relative">
                <div className={`absolute -left-[21px] w-3 h-3 bg-white border-2 rounded-full mt-1.5 ${isFirst ? 'border-green-500' : 'border-gray-300'}`}></div>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${isFirst ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}>
                    {format(new Date(log.logged_at), 'HH:mm a')} 
                    {isFirst && ' (첫 식사)'}
                    {isLast && ' (마지막 식사)'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={onSaveEditing} className="text-green-500 hover:text-green-700 transition-colors p-0.5">
                          <Check size={16} />
                        </button>
                        <button onClick={onCancelEditing} className="text-gray-300 hover:text-gray-500 transition-colors p-0.5">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onStartEditing(log)} className="text-gray-300 hover:text-blue-500 transition-colors p-0.5">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(log.id)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="bg-blue-50 rounded-2xl p-4 mt-2 flex flex-col gap-2 border border-blue-200 animate-fade-in">
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                      type="text"
                      value={editForm.food_name}
                      onChange={(e) => setEditForm({...editForm, food_name: e.target.value})}
                      placeholder="음식 이름"
                      maxLength={30}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                      type="text"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                      placeholder="비고 (선택)"
                      maxLength={30}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                      placeholder="체중(kg) (선택)"
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-4 mt-2">
                    <div className="font-bold text-gray-900 text-base">{log.food_name}</div>
                    {(log.amount || log.weight) && (
                      <div className="text-sm text-gray-500 mt-1">
                        {log.amount}{log.amount && log.weight ? ' • ' : ''}{log.weight ? `체중 ${log.weight}kg` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
