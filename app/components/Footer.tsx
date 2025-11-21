import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                H
              </div>
              <span className="text-2xl font-bold text-blue-600 tracking-tight">HMAPP</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              منصتك الأولى لخدمات الصيانة المنزلية. نربطك بأفضل الفنيين المحترفين لضمان راحة بالك وجودة منزلك.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">روابط سريعة</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-base text-gray-500 hover:text-blue-600 transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-base text-gray-500 hover:text-blue-600 transition-colors">
                  خدماتنا
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-base text-gray-500 hover:text-blue-600 transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">سياسة الموقع</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-base text-gray-500 hover:text-blue-600 transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-base text-gray-500 hover:text-blue-600 transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-base text-gray-500 hover:text-blue-600 transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li className="pt-2 border-t border-gray-100">
                <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  دخول الإدارة
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">تواصل معنا</h3>
            <div className="flex space-x-4 space-x-reverse mb-4">
              {/* Social Icons Placeholders */}
              <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.409-.06 3.809-.06zm1.49 11.013a3.312 3.312 0 11-6.624 0 3.312 3.312 0 016.624 0zm-4.988 1.328a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
              </a>
            </div>
            <p className="text-sm text-gray-500">support@hmapp.com</p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} HMAPP. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}
