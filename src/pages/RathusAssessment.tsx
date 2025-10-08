import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SEOHead } from '@/components/SEOHead';
import { Progress } from '@/components/ui/progress';

const questions = [
  "(۱) اکثر مردم تهاجمی‌تر، قاطع‌تر و صریح‌تر از من هستند.",
  "(۲) به خاطر کمرویی و خجالتی بودن، به جنس مخالف پیشنهاد دیدار نمی‌دهم یا چنین پیشنهادهایی را نمی‌پذیرم.",
  "(۳) وقتی غذای رستوران رضایت من را تأمین نمی‌کند، به گارسون اعتراض می‌کنم.",
  "(۴) مواظبم به عواطف و احساسات دیگران آسیب وارد نکنم، حتی اگر به قیمت آسیب خوردن به عواطف و احساسات خودم باشد.",
  "(۵) اگر فروشنده بخواهد جنسی را که مورد علاقه‌ام نیست نشانم بدهد، برایم سخت است که «نه» بگویم.",
  "(۶) وقتی از من می‌خواهند کاری انجام دهم، همیشه چرایی آن را می‌پرسم.",
  "(۷) وقت‌هایی هست که خودم دنبال یک بحث و گفتگوی شدید و جدی می‌گردم.",
  "(۸) مثل اکثر کسانی که در موقعیت من هستند، برای پیشرفت و جلو افتادن کوشش می‌کنم.",
  "(۹) اگر بخواهم صادقانه بگویم، اکثر افراد از من سوء استفاده می‌کنند.",
  "(۱۰) از گفتگو کردن با غریبه‌ها و افرادی که تازه با آن‌ها آشنا شده‌ام، لذت می‌برم.",
  "(۱۱) اغلب وقتی کسی برایم جذاب است، نمی‌دانم به او چه بگویم و گفتگو را چگونه آغاز کنم.",
  "(۱۲) تلفن کردن به وزارت‌خانه‌ها و نهادها و سازمان‌های دولتی برایم سخت است.",
  "(۱۳) برای درخواست شغل یا پذیرفته شدن در یک موسسه‌ی آموزشی، روش مکاتبه‌ای را به مصاحبه‌ی حضوری ترجیح می‌دهم.",
  "(۱۴) پس دادن جنسی که خریده‌ام، برایم سخت و شرم‌آور است.",
  "(۱۵) اگر یکی از خویشاوندان مورد احترامم مرا خشمگین کند، ترجیح می‌دهم احساسات خود را در خودم پنهان کنم تا این‌که آن‌ها را بیان کنم.",
  "(۱۶) به خاطر این‌که احمق به نظر نرسم، از طرح بعضی پرسش‌ها خودداری کرده‌ام.",
  "(۱۷) گاهی می‌ترسم هنگام بحث کردن، چنان به هم بریزم که بدنم بلرزد و رعشه بگیرد.",
  "(۱۸) اگر یک سخنران مشهور و مورد احترام، نظری را ابراز کند که فکر کنم غلط است، دیدگاه خودم را برای مخاطبان او بیان می‌کنم.",
  "(۱۹) از چانه زدن بر سر قیمت اجتناب می‌کنم.",
  "(۲۰) وقتی یک کار مهم یا ارزشمند انجام بدهم، ترتیبی می‌دهم که دیگران از آن مطلع شوند.",
  "(۲۱) احساسات خود را صادقانه و آزادانه ابراز می‌کنم.",
  "(۲۲) اگر کسی در مورد من حرف‌های بد و نادرست بزند، در اسرع وقت او را پیدا می‌کنم و در این باره با او حرف می‌زنم.",
  "(۲۳) نه گفتن برایم دشوار است.",
  "(۲۴) به جای ابراز خشم و هیجانات منفی، آن‌ها را در خودم فرو می‌خورم و سرکوب می‌کنم.",
  "(۲۵) اگر سرویس‌دهی در یک رستوران یا هر جای دیگر ضعیف باشد، اعتراض می‌کنم.",
  "(۲۶) گاهی اوقات، وقتی از من تعریف می‌شود، نمی‌دانم که چه بگویم.",
  "(۲۷) اگر در تئاتر یا سخنرانی، کسانی در نزدیک من بلند حرف بزنند، از آن‌ها می‌خواهم سکوت کنند یا بروند جای دیگری حرف بزنند.",
  "(۲۸) در یک صف، اگر کسی بخواهد از من جلو بزند، با او وارد نبرد و مجادله می‌شوم.",
  "(۲۹) در اظهارنظر درنگ نمی‌کنم.",
  "(۳۰) مواقعی پیش می‌آید که لال می‌شوم و هیچ حرفی نمی‌توانم بزنم."
];

const scoreOptions = [
  { value: 3, label: "کاملاً درست" },
  { value: 2, label: "درست" },
  { value: 1, label: "تا اندازه‌ای درست" },
  { value: -1, label: "تا اندازه‌ای غلط" },
  { value: -2, label: "غلط" },
  { value: -3, label: "کاملاً غلط" }
];

// Questions to reverse (1-indexed converted to 0-indexed)
const reverseQuestions = [0, 1, 3, 4, 8, 10, 11, 12, 13, 14, 15, 16, 18, 22, 23, 25, 29];

const getInterpretation = (score: number) => {
  if (score >= -90 && score <= -20) {
    return {
      title: "بسیار غیر قاطع",
      description: "این نمره نشان می‌دهد که شما در ابراز نیازها، افکار و احساسات خود مشکل قابل توجهی دارید. ممکن است اغلب احساسات دیگران را بر احساسات خود ترجیح دهید و به هر قیمتی از تعارض اجتناب کنید.",
      suggestions: [
        "تمرین گفتن «نه» در موقعیت‌های کم‌خطر را شروع کنید",
        "در کلاس‌های آموزش مهارت‌های ابراز وجود شرکت کنید",
        "با یک روانشناس یا مشاور برای کار روی اعتماد به نفس مشورت کنید",
        "نیازها و احساسات خود را روزانه بنویسید تا خودآگاهی پیدا کنید"
      ]
    };
  } else if (score > -20 && score <= 0) {
    return {
      title: "موقعیتی غیر قاطع",
      description: "این نمره نشان می‌دهد که قاطعیت شما بسته به موقعیت متفاوت است. ممکن است در برخی زمینه‌ها راحت باشید اما در برخی دیگر مردد یا منفعل.",
      suggestions: [
        "موقعیت‌هایی را که در آن‌ها ابراز وجود برایتان دشوار است شناسایی کنید",
        "قبل از موقعیت‌های چالش‌برانگیز، پاسخ‌های قاطعانه را تمرین کنید",
        "با افراد مورد اعتماد، مهارت‌های ارتباطی خود را تمرین کنید",
        "تکنیک‌های آرامش‌بخشی برای کنترل اضطراب اجتماعی یاد بگیرید"
      ]
    };
  } else if (score > 0 && score <= 20) {
    return {
      title: "تا حدی قاطع",
      description: "نمره در این محدوده به این معناست که شما می‌توانید خود را ابراز کنید، اما شاید نه به طور مداوم یا با راحتی کامل. شما بیشتر قاطع هستید تا غیر قاطع، اما هنوز جای رشد وجود دارد.",
      suggestions: [
        "به تمرین ابراز وجود در موقعیت‌های مختلف ادامه دهید",
        "کتاب‌ها و منابع آموزشی درباره ارتباطات قاطعانه مطالعه کنید",
        "از تکنیک «من» برای بیان احساسات و نیازها استفاده کنید",
        "با بازخورد مثبت، پیشرفت‌های خود را تقویت کنید"
      ]
    };
  } else if (score > 20 && score <= 40) {
    return {
      title: "قاطع",
      description: "این یک محدوده سالم برای قاطعیت است. شما به طور کلی در ابراز نیازهای خود و دفاع از حقوق خود مؤثر هستید و در عین حال به دیگران احترام می‌گذارید.",
      suggestions: [
        "مهارت‌های فعلی خود را حفظ کرده و به عنوان الگو برای دیگران عمل کنید",
        "در موقعیت‌های پیچیده‌تر، مهارت‌های خود را توسعه دهید",
        "به دیگران کمک کنید تا مهارت‌های ابراز وجود خود را بهبود ببخشند",
        "همچنان مراقب باشید که تعادل بین قاطعیت و همدلی را حفظ کنید"
      ]
    };
  } else {
    return {
      title: "احتمالاً تهاجمی",
      description: "نمره‌های در این محدوده نشان می‌دهد که سبک ارتباطی شما ممکن است بیش از حد قدرتمند، خصمانه یا بی‌توجه به حقوق و احساسات دیگران باشد. قاطعیت واقعی درباره برابری قدرت است، نه «برنده شدن» با تحقیر دیگران.",
      suggestions: [
        "روی گوش دادن فعال و همدلی با دیگران تمرکز کنید",
        "قبل از پاسخ دادن، مکث کنید و دیدگاه طرف مقابل را در نظر بگیرید",
        "تکنیک‌های مدیریت خشم و کنترل احساسات را یاد بگیرید",
        "با یک مشاور برای یادگیری ارتباطات متعادل و احترام‌آمیز کار کنید"
      ]
    };
  }
};

export default function RathusAssessment() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerChange = (questionIndex: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    
    questions.forEach((_, index) => {
      const answer = answers[index];
      if (answer !== undefined) {
        // Reverse score for specified questions
        const finalScore = reverseQuestions.includes(index) ? -answer : answer;
        totalScore += finalScore;
      }
    });
    
    setScore(totalScore);
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAssessment = () => {
    setAnswers({});
    setShowResults(false);
    setScore(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const interpretation = getInterpretation(score);

  return (
    <>
      <SEOHead
        title="تست راستوس - پرسشنامه ابراز وجود | LadyBoss Academy"
        description="پرسشنامه ابراز وجود راستوس (Rathus Assertiveness Schedule) - سطح قاطعیت و ابراز وجود خود را ارزیابی کنید"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4 font-farsi" dir="rtl">
        <div className="max-w-4xl mx-auto">
          {!showResults ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
                  تست راستوس
                </h1>
                <p className="text-xl text-muted-foreground mb-2">
                  پرسشنامه ابراز وجود
                </p>
                <div className="max-w-3xl mx-auto space-y-3 mb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    پرسشنامه ابراز وجود راستوس (Rathus Assertiveness Schedule) یکی از معتبرترین ابزارهای روانسنجی برای ارزیابی سطح قاطعیت و توانایی ابراز وجود فردی است. این تست به شما کمک می‌کند تا بفهمید چقدر می‌توانید نیازها، افکار و احساسات خود را به صورت مؤثر و محترمانه بیان کنید.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    به گزاره‌های زیر امتیاز دهید. پاسخ‌های شما کاملاً محرمانه است و تنها برای ارزیابی شخصی شما استفاده می‌شود.
                  </p>
                </div>
              </div>

              {progress > 0 && (
                <Card className="mb-6 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">پیشرفت تست</span>
                      <span className="text-sm text-muted-foreground">
                        {answeredCount} از {questions.length}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              )}

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium leading-relaxed">
                        {question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={answers[index]?.toString()}
                        onValueChange={(value) => handleAnswerChange(index, parseInt(value))}
                      >
                        <div className="flex flex-col gap-2">
                          {scoreOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem
                                value={option.value.toString()}
                                id={`q${index}-${option.value}`}
                              />
                              <Label
                                htmlFor={`q${index}-${option.value}`}
                                className="cursor-pointer text-sm flex-1 flex items-center justify-between"
                              >
                                <span>{option.label}</span>
                                <span className="text-xs font-mono text-muted-foreground mr-2">
                                  ({option.value > 0 ? '+' : ''}{option.value})
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  onClick={calculateScore}
                  disabled={answeredCount !== questions.length}
                  className="px-12"
                >
                  {answeredCount === questions.length
                    ? "محاسبه نتیجه"
                    : `لطفاً به ${questions.length - answeredCount} سوال باقی‌مانده پاسخ دهید`}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-3xl mb-2">نتیجه تست شما</CardTitle>
                  <div className="text-6xl font-bold text-primary my-4">
                    {score}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <h3 className="text-2xl font-bold mb-3 text-primary">
                      {interpretation.title}
                    </h3>
                    <p className="text-lg leading-relaxed text-foreground/90">
                      {interpretation.description}
                    </p>
                  </div>

                  <div className="p-6 rounded-lg bg-accent/10 border border-accent/20">
                    <h4 className="font-bold text-lg mb-4 text-accent-foreground">پیشنهادات برای بهبود:</h4>
                    <ul className="space-y-2">
                      {interpretation.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                          <span className="text-accent mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-lg bg-secondary/50">
                    <h4 className="font-bold text-lg mb-4">طیف نمرات و تفسیر آن‌ها:</h4>
                    <div className="space-y-3 mb-4">
                      <div className="border-r-4 border-destructive pr-3">
                        <p className="font-semibold text-sm">۹۰- تا ۲۰-: بسیار غیر قاطع</p>
                        <p className="text-xs text-muted-foreground">مشکل قابل توجه در ابراز نیازها و احساسات</p>
                      </div>
                      <div className="border-r-4 border-orange-500 pr-3">
                        <p className="font-semibold text-sm">۲۰- تا ۰: موقعیتی غیر قاطع</p>
                        <p className="text-xs text-muted-foreground">قاطعیت بسته به موقعیت متفاوت است</p>
                      </div>
                      <div className="border-r-4 border-yellow-500 pr-3">
                        <p className="font-semibold text-sm">۰ تا ۲۰+: تا حدی قاطع</p>
                        <p className="text-xs text-muted-foreground">توانایی ابراز وجود اما نه به طور مداوم</p>
                      </div>
                      <div className="border-r-4 border-green-500 pr-3">
                        <p className="font-semibold text-sm">۲۰+ تا ۴۰+: قاطع (محدوده سالم)</p>
                        <p className="text-xs text-muted-foreground">مؤثر در ابراز نیازها با احترام به دیگران</p>
                      </div>
                      <div className="border-r-4 border-red-600 pr-3">
                        <p className="font-semibold text-sm">۴۰+ تا ۹۰+: احتمالاً تهاجمی</p>
                        <p className="text-xs text-muted-foreground">سبک ارتباطی بیش از حد قدرتمند یا خصمانه</p>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg mb-3 mt-6">درباره این تست:</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                      در یک نمونهٔ آماری دانشگاهی از ۷۶۴ زن و ۶۳۷ مرد در آمریکا، ۵۰٪ از زنان امتیازی کمتر از ۸ و ۵۰٪ از مردان امتیازی کمتر از ۱۱ کسب کرده‌اند.
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      البته قاطعیت و ابراز وجود، از فرهنگی به فرهنگ دیگر فرق می‌کند. اما به فرض که این هنجار را بپذیرید، خانمی که امتیازی بیشتر از ۸ کسب می‌کند و آقایی که امتیازی بیش از ۱۱ به دست می‌آورد، از نظر صراحت و قاطعیت و ابراز وجود، از نیمی از جامعهٔ هم‌جنسان خود جلوتر است.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button size="lg" onClick={resetAssessment} variant="outline">
                      انجام مجدد تست
                    </Button>
                    <Button size="lg" onClick={() => window.print()}>
                      چاپ نتایج
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
