import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { saveCustomerAddress, updateCustomerProfile } from '@/app/actions'
import LocationPicker from '@/app/components/LocationPicker'
import SubmitButton from '@/app/components/SubmitButton'
import Link from 'next/link'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const params = await searchParams

  // Fetch customer profile
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch default address
  let address = null
  if (customer) {
    const { data: defaultAddr } = await supabase
      .from('customer_addresses')
      .select('id, label, address_text, location')
      .eq('customer_id', customer.id)
      .eq('is_default', true)
      .maybeSingle()
    
    address = defaultAddr
  }

  // Extract lat/lng from location if it exists (assuming PostGIS format)
  let initialLat = 24.7136
  let initialLng = 46.6753
  if (address?.location) {
    try {
      // PostGIS POINT format: "POINT(lng lat)"
      const match = address.location.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/)
      if (match) {
        initialLng = parseFloat(match[1])
        initialLat = parseFloat(match[2])
      }
    } catch (e) {
      console.error('Failed to parse location:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ملفي الشخصي</h1>
          <p className="text-gray-600 mt-2">أدر بياناتك وموقعك</p>
        </div>

        {/* Error message */}
        {params.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              {params.error === 'no_address' ? 'يجب تحديد موقع قبل إنشاء طلب جديد' : decodeURIComponent(params.error)}
            </p>
          </div>
        )}

        {/* Success message */}
        {params.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              {params.success === 'profile_updated' ? '✓ تم تحديث معلوماتك بنجاح' : '✓ تم حفظ العنوان بنجاح'}
            </p>
          </div>
        )}

        {/* Customer Info Card - Editable Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">معلوماتك الشخصية</h2>
          
          <form action={updateCustomerProfile} className="space-y-6">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
              <input
                type="text"
                name="fullName"
                defaultValue={customer?.full_name || ''}
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
              <input
                type="tel"
                name="phone"
                defaultValue={customer?.phone || ''}
                pattern="05[0-9]{8}"
                title="رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="05xxxxxxxx"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-600 bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">البريد الإلكتروني لا يمكن تغييره</p>
            </div>

            {/* Save Button */}
            <SubmitButton text="حفظ التعديلات" loadingText="جاري الحفظ..." />
          </form>
        </div>

        {/* Current Address Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">عنوانك المحفوظ</h2>
          {address ? (
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">التسمية</label>
                <p className="text-lg font-semibold text-gray-800">{address.label}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">الوصف</label>
                <p className="text-lg font-semibold text-gray-800">{address.address_text}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">الإحداثيات</label>
                <p className="text-sm text-gray-700">الدقة: {initialLat.toFixed(4)}, خط الطول: {initialLng.toFixed(4)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-700 text-sm">⚠️ لم تحفظ عنواناً بعد. يرجى تحديد موقعك على الخريطة أدناه.</p>
            </div>
          )}
        </div>

        {/* Update Address Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">تحديث عنوانك</h2>
          
          <form action={saveCustomerAddress} className="space-y-6">
            {/* Location Picker */}
            <LocationPicker 
              initialLat={initialLat}
              initialLng={initialLng}
            />

            {/* Label Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تسمية العنوان (مثل: المنزل، المكتب)
              </label>
              <input
                type="text"
                name="label"
                defaultValue={address?.label || 'المنزل'}
                className="w-full p-3 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="المنزل"
              />
            </div>

            {/* Submit Button */}
            <SubmitButton text="حفظ العنوان" loadingText="جاري التحديث..." />
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm">← العودة للرئيسية</Link>
        </div>
      </div>
    </div>
  )
}
