import type { ProductStory } from "@/lib/car-product-story";

const CAT_LABEL_FR: Record<string, string> = {
  design_exterior: "Design extérieur",
  design_interior: "Design intérieur",
  technology: "Technologies",
  assistance: "Aides à la conduite",
  other: "À savoir",
};

const CAT_LABEL_AR: Record<string, string> = {
  design_exterior: "التصميم الخارجي",
  design_interior: "التصميم الداخلي",
  technology: "التقنيات",
  assistance: "مساعدة السائق",
  other: "معلومات",
};

export function CarProductStory({ story, locale }: { story: ProductStory; locale: string }) {
  const isAr = locale === "ar";
  const lab = isAr ? CAT_LABEL_AR : CAT_LABEL_FR;

  const grouped = story.sections.reduce(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category]!.push(s);
      return acc;
    },
    {} as Record<string, typeof story.sections>,
  );

  const order = ["design_exterior", "design_interior", "technology", "assistance", "other"] as const;

  return (
    <div className="space-y-12">
      <header className="border-b border-zinc-200 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {isAr ? "معلومات مفصّلة عن الموديل" : "Fiche produit détaillée"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
          {isAr
            ? "نصوص إرشادية طويلة (تصميم، تقنيات، مساعدة، بيئة) — راجع الوكيل للبيانات التعاقدية."
            : "Contenu long indicatif (design, technologies, assistance, environnement) — validez toujours avec votre concessionnaire pour les données contractuelles."}
        </p>
        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          {order
            .filter((k) => grouped[k]?.length)
            .map((k) => (
              <a
                key={k}
                href={`#cat-${k}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-800 transition hover:bg-white"
              >
                {lab[k] ?? k}
              </a>
            ))}
          {story.faq.length > 0 ? (
            <a
              href="#faq-produit"
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-800 transition hover:bg-white"
            >
              {isAr ? "الأسئلة الشائعة" : "FAQ"}
            </a>
          ) : null}
          <a
            href="#environnement"
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-800 transition hover:bg-white"
          >
            {isAr ? "الاستهلاك والبيئة" : "Consommation & CO₂"}
          </a>
        </nav>
      </header>

      {order.map((cat) => {
        const list = grouped[cat];
        if (!list?.length) return null;
        return (
          <section key={cat} id={`cat-${cat}`} className="scroll-mt-24">
            <h3 className="text-lg font-semibold uppercase tracking-[0.14em] text-zinc-500">{lab[cat]}</h3>
            <div className="mt-6 space-y-10">
              {list.map((s) => (
                <article
                  key={s.id}
                  className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm ring-1 ring-zinc-100 sm:p-8"
                >
                  <h4 className="text-xl font-semibold leading-snug text-zinc-950 sm:text-2xl">
                    {isAr ? s.titleAr : s.titleFr}
                  </h4>
                  <div className="prose prose-zinc mt-4 max-w-none text-base leading-relaxed prose-p:mb-4">
                    {(isAr ? s.bodyAr : s.bodyFr).split(/\n\n+/).map((para, i) => (
                      <p key={i} className="text-zinc-800">
                        {para.split("**").map((chunk, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-semibold text-zinc-950">
                              {chunk}
                            </strong>
                          ) : (
                            <span key={j}>{chunk}</span>
                          ),
                        )}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {story.faq.length > 0 ? (
        <section id="faq-produit" className="scroll-mt-24">
          <h3 className="text-lg font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {isAr ? "أسئلة شائعة" : "Foire aux questions"}
          </h3>
          <div className="mt-6 space-y-4">
            {story.faq.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ring-zinc-100 open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-semibold text-zinc-950 [&::-webkit-details-marker]:hidden">
                  <span>{isAr ? item.qAr : item.qFr}</span>
                  <span className="shrink-0 text-zinc-400 transition group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-zinc-700">{isAr ? item.aAr : item.aFr}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section id="environnement" className="scroll-mt-24">
        <h3 className="text-lg font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {isAr ? "الاستهلاك والانبعاثات والبيئة" : "Consommation, émissions et données environnementales"}
        </h3>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 sm:p-8">
          <p className="whitespace-pre-line text-base leading-relaxed text-zinc-800">{isAr ? story.environmentAr : story.environmentFr}</p>
        </div>
      </section>

      <footer className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-6 text-sm leading-relaxed text-amber-950">
        <p className="font-semibold">{isAr ? "إخلاء مسؤولية" : "Mentions légales indicatives"}</p>
        <p className="mt-2 whitespace-pre-line">{isAr ? story.disclaimerAr : story.disclaimerFr}</p>
      </footer>
    </div>
  );
}
