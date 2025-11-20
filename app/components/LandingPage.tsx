import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50" dir="rtl">
      {/* Header/Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-blue-600">🏠 HMAPP</h1>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
          خدمات HMAPP
        </h2>
        <p className="text-xl sm:text-2xl text-gray-600 mb-8">
          حلك الشامل لصيانة المنزل
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
      </section>

      {/* Choose Your Role Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-4">
          اختر دورك
        </h3>
        <p className="text-center text-gray-600 mb-12 text-lg">
          حدد كيف تريد استخدام HMAPP
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Customer Card */}
          <Link href="/login?role=customer">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 cursor-pointer h-full flex flex-col items-center text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-full w-24 h-24 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">👤</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                أحتاج إلى خدمة
              </h4>
              <p className="text-gray-600 mb-6 flex-grow">
                انشر طلب خدمتك واستقبل عروض أسعار من فنيين معتمدين
              </p>
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
                احجز الآن ←
              </button>
            </div>
          </Link>

          {/* Technician Card */}
          <Link href="/signup-technician">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 cursor-pointer h-full flex flex-col items-center text-center group">
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-full w-24 h-24 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">🔧</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                أنا فني
              </h4>
              <p className="text-gray-600 mb-6 flex-grow">
                انضم إلى شبكة المحترفين لدينا وقم بتنمية عملك
              </p>
              <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
                انضم للفريق ←
              </button>
            </div>
          </Link>

          {/* Company Card */}
          <Link href="/signup-company">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 cursor-pointer h-full flex flex-col items-center text-center group">
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-full w-24 h-24 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">🏢</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                أنا شركة
              </h4>
              <p className="text-gray-600 mb-6 flex-grow">
                سجل شركتك وأدر فريق الفنيين الخاص بك
              </p>
              <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
                سجل كشركة ←
              </button>
            </div>
          </Link>
        </div>
      </section>

      {/* Features Section (Optional) */}
      <section className="bg-gray-50 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            لماذا تختار HMAPP؟
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                محترفون معتمدون
              </h4>
              <p className="text-gray-600">
                جميع الفنيين تم فحصهم وتقييمهم من قبل العملاء
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                استجابة سريعة
              </h4>
              <p className="text-gray-600">
                احصل على عروض أسعار خلال ساعات، وليس أيام
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                آمن وموثوق
              </h4>
              <p className="text-gray-600">
                معلوماتك ومدفوعاتك آمنة دائماً
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 خدمات HMAPP. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  )
}
