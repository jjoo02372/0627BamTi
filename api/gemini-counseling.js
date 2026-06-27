// 보안 주석:
// 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있습니다.
//    Gemini API 호출은 이 Vercel Serverless Function에서만 처리합니다.
// 2. .env 파일은 GitHub에 올리지 않습니다 (.gitignore에 등록 필수).
// 3. Vercel 배포 시 Project Settings > Environment Variables에 GEMINI_API_KEY를 등록하세요.
// 4. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한합니다.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "허용되지 않는 메서드입니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ success: false, error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body || {};

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({
      success: false,
      error:
        "필수 항목(studentAlias, gradeSummary, learningTraits, teacherConcern)이 누락되었습니다.",
    });
  }

  const prompt = `당신은 교사를 돕는 학생 상담 전략 조력자입니다.
학생을 단정적으로 진단하거나 판단하지 않으며, 교사가 학생을 이해하고 대화할 수 있도록 돕는 방향으로만 답변합니다.
"의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다"처럼 단정하는 표현은 사용하지 않습니다.

아래 학생 정보와 교사의 고민을 바탕으로 상담 전략을 제안해 주세요.

[학생 익명 정보]
- 학생 호칭: ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성: ${learningTraits}
- 교사 고민: ${teacherConcern}

다음 형식으로 답변해 주세요:

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원

※ 이 상담 전략은 참고용이며, 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody);
      return res
        .status(502)
        .json({ success: false, error: `Gemini API 오류 (${geminiRes.status})` });
    }

    const data = await geminiRes.json();

    // gemini-2.5-pro는 thinking 파트를 포함할 수 있으므로 thought가 아닌 파트만 추출합니다.
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const result = parts
      .filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join("");

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, error: `서버 오류: ${err.message}` });
  }
};
