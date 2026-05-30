import React from 'react';
import { Trash2, Pencil, Check, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

const parseKstToDate = (eatingAtStr) => {
  if (!eatingAtStr) return new Date();
  if (eatingAtStr.includes('Z') || eatingAtStr.includes('+')) {
    return new Date(eatingAtStr);
  }
  const isoStr = eatingAtStr.replace(' ', 'T').slice(0, 19) + '+09:00';
  return new Date(isoStr);
};

const formatTimeOnly = (eatingAtStr) => {
  const t = parseKstToDate(eatingAtStr);
  return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
};

export default function ActiveCycleTimeline({ 
  completedCycle,
  prevFastingResult,
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
    <div className="flex flex-col h-full mt-4 gap-6">
      
      {/* 1. 직전 식사 사이클 기록 */}
      {completedCycle && completedCycle.length > 0 && (
        <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-500 flex items-center gap-1.5">
                <span>◀ 직전 식사 사이클 기록</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">완료된 식사 윈도우</p>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
              식사 {completedCycle.length}건
            </span>
          </div>

          <div className="pl-4 border-l-2 border-dashed border-gray-200 flex flex-col gap-4">
            {completedCycle.map((log, index) => {
              const isFirst = index === 0;
              const isLast = index === completedCycle.length - 1 && completedCycle.length > 1;

              return (
                <div key={log.id} className="relative">
                  <div className={`absolute -left-[21px] w-2.5 h-2.5 bg-white border-2 rounded-full mt-1.5 ${isFirst ? 'border-gray-400' : 'border-gray-300'}`}></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-400 px-2 py-0.5 bg-gray-100 rounded">
                      {formatTimeOnly(log.eating_at)} 
                      {isFirst && ' (첫 식사)'}
                      {isLast && ' (마지막 식사)'}
                    </span>
                  </div>

                  <div className="bg-gray-100/75 rounded-2xl p-4 mt-1 border border-gray-200/30">
                    <div className="font-bold text-gray-600 text-sm">{log.food_name}</div>
                    {(log.amount || log.weight) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {log.amount}{log.amount && log.weight ? ' • ' : ''}{log.weight ? `체중 ${log.weight}kg` : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 공복 구간 커넥터 표시 */}
      {prevFastingResult && (
        <div className={`mx-2 my-1 px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
          prevFastingResult.success 
            ? 'bg-green-50 border-green-100 text-green-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {prevFastingResult.success ? (
              <CheckCircle2 size={18} className="text-green-600" />
            ) : (
              <ShieldAlert size={18} className="text-red-600" />
            )}
            <span className="text-xs font-bold">
              사이클 간 공복 시간: <span className="text-sm font-black underline">{prevFastingResult.hours}시간</span>
            </span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            prevFastingResult.success ? 'bg-green-200/60 text-green-950' : 'bg-red-200/60 text-red-950'
          }`}>
            {prevFastingResult.success ? '공복 성공 🎉' : '공복 미달'}
          </span>
        </div>
      )}

      {/* 3. 현재 식사 사이클 기록 */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
              <span>▶ 현재 식사 사이클 기록</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">최근 식사 시작 기준</p>
          </div>
          {currentActiveCycle.length > 0 && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
              진행 중
            </span>
          )}
        </div>

        <div className="relative pl-4 border-l-2 border-green-500 flex flex-col gap-6 pb-2">
          {currentActiveCycle.length === 0 ? (
            <div className="text-sm text-gray-400 font-medium py-6 text-center">
              아직 기록된 식단이 없습니다. (현재 공복 중 ⏳)
            </div>
          ) : (
            currentActiveCycle.map((log, index) => {
              const isFirst = index === 0;
              const isLast = index === currentActiveCycle.length - 1 && currentActiveCycle.length > 1;
              const isEditing = editingLogId === log.id;
              
              return (
                <div key={log.id} className="relative animate-fade-in">
                  <div className={`absolute -left-[21px] w-3 h-3 bg-white border-2 rounded-full mt-1.5 ${isFirst ? 'border-green-500 bg-green-50' : 'border-green-300'}`}></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isFirst ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                      {formatTimeOnly(log.eating_at)} 
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
                    <div className="bg-gray-50 rounded-2xl p-4 mt-1 border border-gray-100">
                      <div className="font-bold text-gray-900 text-sm">{log.food_name}</div>
                      {(log.amount || log.weight) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {log.amount}{log.amount && log.weight ? ' • ' : ''}{log.weight ? `체중 ${log.weight}kg` : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
