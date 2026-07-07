import { createFileRoute, Link } from "@tanstack/react-router";
import { getStudent, isThursday, useFirestoreData } from "@/lib/firestore-data";
import { KnightCard } from "@/components/knight-card";
import { IslamicPatternBg } from "@/components/islamic-pattern";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/knight/$studentId")({
  head: () => ({ meta: [{ title: "بطاقة الفارس — مركز الفرقان" }] }),
  component: KnightPage,
});

function KnightPage() {
  const { studentId } = Route.useParams();
  const { students, ready } = useFirestoreData();
  const s = getStudent(studentId) ?? students.find((item) => item.id === studentId);
  if (!ready) return <div className="p-8">جارٍ تحميل البيانات...</div>;
  if (!s) return <div className="p-8">الطالب غير موجود</div>;
  const title = isThursday() ? "فارس الأسبوع" : "فارس اليوم";

  return (
    <div className="relative min-h-screen pattern-islamic">
      <IslamicPatternBg />
      <div className="relative mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowRight className="ml-2 h-4 w-4" /> الرئيسية
            </Link>
          </Button>
        </div>
        <div className="flex justify-center">
          <KnightCard student={s} title={title} />
        </div>
      </div>
    </div>
  );
}
