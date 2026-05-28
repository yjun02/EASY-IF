import { Info, Target, Flame, Heart, BookOpen } from 'lucide-react';

export default function Guide() {
  return (
    <div className="flex flex-col h-full bg-white md:bg-gray-50 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="md:bg-white md:rounded-3xl md:shadow-sm md:p-8 flex-1">
        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="text-green-600" />
          간헐적 단식 가이드
        </h2>

        {/* Intro */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8">
          <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
            <Info size={18} />
            안내해 드립니다
          </h3>
          <p className="text-sm text-indigo-950 leading-relaxed">
            본 가이드는 개발자가 3개월간 10kg을 감량하며 직접 겪은 임상적 경험과 대사 메커니즘을 바탕으로 작성되었습니다. 의학적 처방을 대신할 수는 없으나, 직접 효과를 본 핵심 원리와 실전 팁을 객관적으로 정리했으니 여러분의 루틴 수립에 도움이 되기를 바랍니다.
          </p>
        </div>

        <div className="space-y-10">
          {/* Section 1 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm">1</span>
              간헐적 단식의 핵심 원리: 왜 살이 빠질까?
            </h3>
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
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm">2</span>
              실전 규칙: 이것만은 꼭 지키세요
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-1">① 최소 공복 시간 유지 (가장 필수)</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  매일 음식 섭취 사이의 공복 상태를 최소 16시간 이상 유지하는 것이 원칙입니다. 본 서비스에서 설정한 식사 가능 시간 외의 시간은 완벽한 공복 상태를 유지해야 몸이 지방을 태우기 시작합니다.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-1">② 강박 관념 버리기</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  사회생활이나 예기치 못한 약속으로 루틴이 깨질 수 있습니다. 일주일에 한두 번 루틴이 지켜지지 않았다고 해서 자책하거나 포기할 필요는 전혀 없습니다. 루틴이 깨졌다면, 마지막 음식을 먹은 시점부터 다시 공복 시간을 계산하여 단식을 시작하면 됩니다. 우리 서비스의 실시간 타이머를 보며 유연하게 대처하세요.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 w-6 h-6 flex items-center justify-center rounded-full text-sm">3</span>
              정체기 돌파 전략: 주 1~2회 몸 속이기 (치팅데이)
            </h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              저탄수화물 식단이나 단식 루틴을 너무 오랜 기간 똑같이 지속하면, 몸은 적은 에너지 소비에 적응하여 대사 속도를 떨어뜨리고 감량 정체기를 만들어냅니다. 이때 필요한 것이 대사 시스템을 자극하는 변주입니다.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></div></div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  <strong className="text-gray-900">대사 속도 끌어올리기:</strong> 일주일에 1~2회 정도는 공복 시간이나 메뉴에 구애받지 않고, 평소 먹고 싶었던 음식(마라탕, 배달음식 등)을 즐기는 '치팅데이'를 가집니다.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></div></div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  <strong className="text-gray-900">몸 착각하게 만들기:</strong> 에너지가 과도하게 들어오면 몸은 "지금 굶주리는 상태가 아니구나"라고 착각하여 대사 속도를 다시 낮추지 않고 유지하게 됩니다.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div></div>
                <p className="text-green-800 text-sm leading-relaxed font-medium bg-green-50 p-2 rounded-lg">
                  <strong>핵심:</strong> 치팅은 지속 가능한 단식을 위한 전략적 선택입니다. 일주일에 2회 이하로 현명하게 활용하면 대사 유연성(Metabolic Flexibility)을 유지하는 데 큰 도움이 됩니다.
                </p>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-gray-900 text-white rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
              <span className="bg-white text-gray-900 w-6 h-6 flex items-center justify-center rounded-full text-sm">4</span>
              마지막으로: 간단하게, 그리고 꾸준하게
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              간헐적 단식의 가장 큰 장점은 '단순함'에 있습니다. 복잡한 칼로리 계산이나 닭가슴살만 먹는 극단적인 식단은 오래가지 못합니다.
            </p>
            <p className="text-green-400 font-bold leading-relaxed">
              내가 먹은 음식을 있는 그대로 기록하고, 정해진 시간 동안 공복을 유지하는 것. 이 두 가지만 꾸준히 실천한다면 몸은 자연스럽게 건강한 대사 균형을 찾아갈 것입니다. 오늘부터 '간단하게 간단하자'와 함께 가벼워지는 몸을 경험해 보세요!
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
