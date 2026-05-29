import React, { useState } from 'react';
import { Info, Target, Flame, Heart, BookOpen, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import SEO from '../components/SEO';

const AccordionItem = ({ title, icon, children, isOpen, onClick }) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4 shadow-sm">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
          {icon}
          {title}
        </h3>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ overflow: 'hidden' }}
      >
        <div className="p-5 pt-0 border-t border-gray-100">
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
};

export default function Guide() {
  const [openSections, setOpenSections] = useState({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
    <SEO 
      title="간헐적 단식 가이드" 
      description="개발자가 3개월간 10kg을 감량하며 겪은 간헐적 단식의 핵심 원리와 필수 규칙을 알려드립니다. 올바른 방법으로 건강하게 체중을 감량해보세요." 
      url="/guide" 
    />
    <div className="flex flex-col h-full bg-white w-full">
      <div className="p-4 md:p-8 flex-1">
        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="text-green-600" />
          간헐적 단식 가이드
        </h2>

        {/* Intro */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 mb-8">
          <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
            <Info size={18} />
            안내해 드립니다
          </h3>
          <p className="text-sm text-indigo-950 leading-relaxed">
            본 가이드는 개발자가 3개월간 10kg을 감량하며 직접 겪은 임상적 경험과 대사 메커니즘을 바탕으로 작성되었습니다. 의학적 처방을 대신할 수는 없으나, 직접 효과를 본 핵심 원리와 실전 팁을 객관적으로 정리했으니 여러분의 루틴 수립에 도움이 되기를 바랍니다.
          </p>
        </div>

        <div className="space-y-4">
          {/* Section 1 */}
          <AccordionItem
            isOpen={openSections[1]}
            onClick={() => toggleSection(1)}
            title="간헐적 단식의 핵심 원리: 왜 살이 빠질까?"
            icon={<span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold shrink-0">1</span>}
          >
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              간헐적 단식은 단순히 '적게 먹어서' 살을 빼는 방법이 아닙니다. 핵심은 '음식을 먹는 시간'을 제한하여 몸의 대사 시스템을 지방 연소 모드로 전환하는 것입니다.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="mt-1"><Target size={16} className="text-green-500" /></div>
                <div>
                  <strong className="text-gray-900">인슐린 수치 다운(Down):</strong> 
                  <span className="text-gray-600 text-sm ml-1">음식을 섭취하면 인슐린 분비가 촉진되어 에너지를 축적합니다. 반대로 단식을 통해 인슐린 수치를 낮게 유지하면, 몸은 탄수화물 대신 저장되어 있던 체지방을 주 에너지원으로 사용하기 시작합니다.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><Flame size={16} className="text-green-500" /></div>
                <div>
                  <strong className="text-gray-900">지방 연소 모드 전환:</strong> 
                  <span className="text-gray-600 text-sm ml-1">마지막 식사 후 대략 12시간이 지나면 혈당이 떨어지고 인슐린 분비가 억제됩니다. 이때부터 체지방 연소가 극대화되는 대사 환경이 조성됩니다.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><Heart size={16} className="text-green-500" /></div>
                <div>
                  <strong className="text-gray-900">시간의 제한, 메뉴의 자유:</strong> 
                  <span className="text-gray-600 text-sm ml-1">칼로리를 극단적으로 제한하며 스트레스를 받는 대신, 정해진 식사 창 안에서 원하는 음식을 즐기면서도 지속 가능한 감량이 가능해집니다.</span>
                </div>
              </li>
            </ul>
          </AccordionItem>

          {/* Section 2 */}
          <AccordionItem
            isOpen={openSections[2]}
            onClick={() => toggleSection(2)}
            title="간헐적 단식을 위한 필수 규칙"
            icon={<span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold shrink-0">2</span>}
          >
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-1">① 최소 공복 시간 유지 (가장 필수)</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  매일 음식 섭취 사이의 공복 상태를 최소 16시간(혹은 설정한 식사 시간에 따라 변동) 이상 유지하는 것이 원칙입니다. 본 서비스에서 설정한 식사 가능 시간 외의 시간은 완벽한 공복 상태를 유지해야 몸이 지방을 태우기 시작합니다.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-1">② 강박 관념 버리기</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  사회생활이나 예기치 못한 약속으로 루틴이 깨질 수 있습니다. 일주일에 한두 번 루틴이 지켜지지 않았다고 해서 자책하거나 포기할 필요는 전혀 없습니다. 루틴이 깨졌다면, 마지막 음식을 먹은 시점부터 다시 공복 시간을 계산하여 단식을 시작하면 됩니다. 우리 서비스의 실시간 타이머를 보며 유연하게 대처하세요.
                </p>
              </div>
            </div>
          </AccordionItem>

          {/* Section 3 */}
          <AccordionItem
            isOpen={openSections[3]}
            onClick={() => toggleSection(3)}
            title="정체기 돌파: 주 1~2회 치팅데이"
            icon={<span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold shrink-0">3</span>}
          >
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              저탄수화물 식단이나 단식 루틴을 너무 오랜 기간 똑같이 지속하면, 몸은 적은 에너지 소비에 적응하여 대사 속도를 떨어뜨리고 감량 정체기를 만들어냅니다. 이때 필요한 것이 대사 시스템을 자극하는 변주입니다.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></div></div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  <strong className="text-gray-900">공복 루틴 깨기:</strong> 일주일에 1~2회 정도는 공복 시간을 무시하고 평소 먹고 싶었던 음식(마라탕, 배달음식 등)을 즐기는 '치팅데이'를 가집니다. 에너지가 과도하게 들어오면 몸은 "지금 굶주리는 상태가 아니구나"라고 착각하여 대사 속도를 다시 낮추지 않고 유지하게 됩니다.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div></div>
                <p className="text-green-800 text-sm leading-relaxed font-medium bg-green-50 p-2 rounded-2xl">
                  <strong>핵심:</strong> 치팅은 지속 가능한 단식을 위한 전략적 선택입니다. 일주일에 2회 이하로 현명하게 활용하면 대사 유연성(Metabolic Flexibility)을 유지하는 데 큰 도움이 됩니다.
                </p>
              </li>
            </ul>
          </AccordionItem>

          {/* Section 4 (마지막으로) */}
          <AccordionItem
            isOpen={openSections[4]}
            onClick={() => toggleSection(4)}
            title="마지막으로: 간단하게, 그리고 꾸준하게"
            icon={<span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold shrink-0">4</span>}
          >
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              간헐적 단식의 가장 큰 장점은 '단순함'에 있습니다. 복잡한 칼로리 계산이나 닭가슴살만 먹는 극단적인 식단은 오래가지 못합니다.
            </p>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <p className="text-green-800 font-medium text-sm leading-relaxed">
                내가 먹은 음식을 있는 그대로 기록하고, 정해진 시간 동안 공복을 유지하는 것. 이 두 가지만 꾸준히 실천한다면 몸은 자연스럽게 건강한 대사 균형을 찾아갈 것입니다. 오늘부터 '간단하게 간단하자'와 함께 가벼워지는 몸을 경험해 보세요!
              </p>
            </div>
          </AccordionItem>

          {/* Section 5 (Q&A) */}
          <AccordionItem
            isOpen={openSections[5]}
            onClick={() => toggleSection(5)}
            title="자주 묻는 질문 (Q&A)"
            icon={<span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full shrink-0"><HelpCircle size={14} /></span>}
          >
            <div className="space-y-6">
              {/* 공복 및 기본 규칙 */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">공복 및 기본 규칙 관련</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 공복 시간에 먹어도 되는 것은 무엇인가요?
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>물, 제로 음료, 단맛이 없는 아메리카노, 약간의 소금물 등 칼로리가 거의 없는 수분류는 공복 상태를 깨지 않으므로 안심하고 드셔도 됩니다. 앱에 따로 기록할 필요도 없어요! 특히 공복 상태에서 마시는 아메리카노 한 잔은 대사량을 높이고 에너지 소모를 돕는 좋은 친구가 될 수 있습니다. 만약 배고픔을 도저히 견디기 힘들다면, 탄수화물은 최대한 피하고 단백질이나 지방 위주로 아주 소량만 섭취하는 것도 현실적인 대안이 될 수 있습니다.</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 공복 시간을 오래 유지할수록 효과가 더 좋나요?
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>보통 단식을 시작하고 일정 시간이 지나면, 우리 몸은 간에 저장해둔 에너지를 다 쓰고 체지방을 태우기 시작합니다. 이 '지방 연소 모드'에 확실하게 진입하려면 매일 최소 16시간 이상 공복을 유지하는 것이 가장 중요해요. 하지만 몸에 너무 무리가 가면 꾸준히 하기 어려우므로, 일상적인 루틴에서는 공복을 20시간 넘기지 않는 것을 권장해 드립니다.</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 피치 못할 사정으로 단식 루틴을 지키지 못했을 때는 어떻게 하나요?
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>사회생활이나 즐거운 약속 때문에 하루 이틀 루틴이 깨졌다고 해서 절대 스트레스 받지 마세요! 일정이 조금 어긋났다면 당황하지 말고, 마지막으로 음식을 드신 시간부터 다시 16시간 동안 공복을 유지해 주시면 됩니다. 우리 몸의 대사 시스템은 생각보다 금방 원래 리듬을 되찾을 수 있답니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 식단 및 영양 */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">식단 및 영양 관련</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 식사 가능 시간에 피해야 할 구체적인 음식을 알려주세요.
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>탄수화물 섭취를 줄일수록 인슐린 수치가 낮게 유지되어 체지방 감량 속도가 눈에 띄게 빨라집니다. 따라서 당류(설탕)나 면, 떡 같은 정제 탄수화물은 치팅데이가 아니라면 가급적 피하는 것이 좋아요. 처음 일주일 정도는 탄수화물이 부족해서 허기가 질 수 있지만, 이 시기만 잘 넘기면 위가 줄어들어 식욕 조절이 훨씬 수월해집니다. 허용된 식사 시간(6~8시간) 동안에는 고기나 기름진 음식, 단백질 셰이크 등을 비교적 자유롭게 드실 수 있으니 식단 스트레스는 내려놓으셔도 좋습니다!</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 단식 기간 중 치팅데이에는 메뉴만 바꾸면 되나요? 공복 시간은 지켜야 하나요?
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>치팅데이에는 단순히 맛있는 것을 먹는 것에 그치지 않고, 일부러 '시간 제한(공복 루틴)' 자체를 완전히 깨뜨리는 것이 포인트입니다! 공복 시간은 칼같이 지키면서 메뉴만 바꾸면, 우리 몸이 적은 에너지 소모량에 적응해버려 정체기가 올 수 있거든요. 따라서 일주일에 한두 번은 시간과 상관없이 마라탕이나 평소 드시고 싶었던 음식을 자유롭게 즐겨보세요. 식단과 시간에 모두 확실한 변화를 주어야 몸이 '아, 단식 중이 아니구나!'라고 착각하여 대사 속도를 다시 힘차게 끌어올릴 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 운동 관련 */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">운동 관련</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 운동을 반드시 병행해야 하나요?
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>간헐적 단식은 식단과 시간 제한만으로도 훌륭한 체중 감량 효과를 기대할 수 있습니다. 하지만 적절한 운동을 병행하면 감량 속도가 붙고, 몸에 탄력이 생기는 등 훨씬 좋은 결과를 얻을 수 있어요. 식사를 마치고 20~30분 정도 가볍게 걷는 유산소 운동은 식후 혈당을 부드럽게 낮춰주는 데 큰 도움이 됩니다.</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-2 flex gap-2">
                      <span className="text-indigo-500 shrink-0">Q.</span> 유산소 운동과 무산소(근력) 운동 중 어떤 것이 단식에 더 유리한가요?
                    </p>
                    <div className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-green-600 font-bold shrink-0">A.</span>
                      <p>체지방을 빼면서도 소중한 근육을 지키기 위해서는, 무산소 근력 운동 위주로 짧고 굵게 진행하시는 것이 가장 효과적입니다. 과도한 유산소 운동은 자칫 극심한 배고픔을 유발해서 꾸준한 단식을 방해할 수 있거든요. 만약 유산소 운동을 꼭 하고 싶으시다면, 공복 상태를 쭉 유지하다가 '첫 식사를 하기 바로 직전'에 하시는 것을 가장 추천해 드립니다!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionItem>
        </div>
      </div>
    </div>
    </>
  );
}
