/**
 * إدراج JSON-LD واحد للصفحة.
 *
 * سبب وجود المكوّن: كان كل ملف يكرّر `<script dangerouslySetInnerHTML={{…JSON.stringify}}>`
 * بنفس الشكل. تجميعه في مكان واحد يضمن أن كل البيانات تمرّ على `JSON.stringify`
 * (فلا يمكن أن يتسرّب HTML من قيمة نصية) وأن الشكل واحد في كل الصفحات.
 *
 * لا يقرأ أي مدخلات من المستخدم مباشرة: كل مستدعٍ يمرّر كائنًا مبنيًّا من حقول القاعدة.
 */
export function JsonLd({ data, id }: { data: unknown; id?: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
