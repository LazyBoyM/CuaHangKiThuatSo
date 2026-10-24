import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Chọn danh mục' },
  { value: 'Ảnh', label: 'Ảnh & Đồ họa' },
  { value: 'Video', label: 'Video & Animation' },
  { value: 'Nhạc', label: 'Nhạc & Âm thanh' },
  { value: 'Template', label: 'Template & Theme' },
  { value: 'Phần mềm', label: 'Code & Phần mềm' },
  { value: 'Ebook', label: 'Ebook & Tài liệu' },
  { value: 'Khác', label: 'Khác' },
]

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    thumbnail: '',
    demoUrl: '',
    fileUrl: '',
    images: ['']
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`)
        const p = res.data
        setFormData({
          title: p.title || '',
          description: p.description || '',
          price: p.price?.toString() || '',
          category: p.category || '',
          thumbnail: p.thumbnail || '',
          demoUrl: p.demoUrl || '',
          fileUrl: p.fileUrl || '',
          images: p.images?.length ? p.images : ['']
        })
      } catch {
        toast.error('Không thể tải thông tin sản phẩm')
        navigate('/my-products')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const getCategoryConfig = (category) => {
    switch (category) {
      case 'Phần mềm':
      case 'Template':
        return { demoLabel: 'Link Live Preview (Website demo)', demoPlaceholder: 'https://preview.your-theme.com', fileType: 'file', showGallery: true }
      case 'Nhạc':
        return { demoLabel: 'Link nghe thử (SoundCloud/Spotify/MP3)', demoPlaceholder: 'https://soundcloud.com/you/track', fileType: 'audio', showGallery: false }
      case 'Video':
        return { demoLabel: 'Link Video Trailer (YouTube/Vimeo)', demoPlaceholder: 'https://youtube.com/watch?v=...', fileType: 'video', showGallery: false }
      case 'Ảnh':
        return { demoLabel: 'Link xem trước thu nhỏ (Watermarked)', demoPlaceholder: 'https://...', fileType: 'image', showGallery: true }
      case 'Ebook':
        return { demoLabel: 'Link đọc thử (PDF Sample)', demoPlaceholder: 'https://drive.google.com/file/...', fileType: 'file', showGallery: false }
      default:
        return { demoLabel: 'Link xem trước / Preview', demoPlaceholder: 'https://...', fileType: 'other', showGallery: true }
    }
  }

  const activeConfig = getCategoryConfig(formData.category)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] })
  }

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    if (newImages.length === 0) newImages.push('')
    setFormData({ ...formData, images: newImages })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.price || !formData.fileUrl || !formData.category) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)')
      return
    }

    if (!formData.fileUrl.startsWith('http')) {
      toast.error('Link tải file gốc phải bắt đầu bằng http:// hoặc https://')
      return
    }

    setSaving(true)
    try {
      const validImages = formData.images.filter(img => img.trim() !== '')
      let finalThumbnail = formData.thumbnail
      if (!finalThumbnail && validImages.length > 0) {
        finalThumbnail = validImages[0]
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        thumbnail: finalThumbnail || 'https://placehold.co/600x400/e5e7eb/9ca3af?text=No+Image',
        fileUrl: formData.fileUrl,
        demoUrl: formData.demoUrl,
        fileType: activeConfig.fileType,
        images: validImages
      }

      await api.put(`/products/${id}`, payload)
      toast.success('Cập nhật thành công! Sản phẩm sẽ chờ Admin duyệt lại.')
      navigate('/my-products')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/my-products" className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa sản phẩm</h1>
      </div>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <span>Sau khi cập nhật, sản phẩm sẽ quay về trạng thái <strong>"Chờ duyệt"</strong> và tạm ẩn khỏi cửa hàng cho đến khi Admin phê duyệt lại.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phần 1: Thông tin cơ bản */}
        <Card padding="lg">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">1</span>
            Thông tin cơ bản
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Danh mục sản phẩm *"
                name="category"
                options={CATEGORY_OPTIONS}
                value={formData.category}
                onChange={handleChange}
                required
              />
              <Input
                label="Giá (VND) *"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="50000"
                required
              />
            </div>

            <Input
              label="Tên sản phẩm *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Source code E-commerce ReactJS"
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Mô tả công năng, công nghệ, hướng dẫn cơ bản..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
              />
            </div>
          </div>
        </Card>

        {/* Phần 2: Tài nguyên */}
        {formData.category && (
          <Card padding="lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">2</span>
              Media & Tài nguyên
            </h2>

            <div className="space-y-6">
              {/* Public */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning">Public</Badge>
                  <span className="text-sm text-gray-500">Khách hàng có thể xem nội dung này trước khi mua.</span>
                </div>

                <Input
                  label="Ảnh đại diện (Thumbnail - 16:9)"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  placeholder="https://imgur.com/... (Link ảnh bìa)"
                />

                <Input
                  label={activeConfig.demoLabel}
                  name="demoUrl"
                  value={formData.demoUrl}
                  onChange={handleChange}
                  placeholder={activeConfig.demoPlaceholder}
                />

                {activeConfig.showGallery && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-sm font-medium text-gray-700">Ảnh Preview (Gallery)</label>
                    <p className="text-xs text-gray-500 mb-2">Thêm nhiều ảnh chụp màn hình/demo (Tùy chọn)</p>
                    {formData.images.map((img, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          name={`image-${index}`}
                          value={img}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3"
                          onClick={() => removeImageField(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                      + Thêm ảnh
                    </Button>
                  </div>
                )}
              </div>

              {/* Secret */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">Secret File</Badge>
                  <span className="text-sm text-emerald-700 font-medium">Link tài liệu gốc. Chỉ hiển thị khi ĐÃ THANH TOÁN.</span>
                </div>

                <Input
                  label="Link tải file gốc *"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                  required
                />
                <p className="text-xs text-emerald-600">Đảm bảo link Drive đã được set quyền "Bất kỳ ai có liên kết". Khách mua sẽ nhận được link này.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" loading={saving} className="flex-1 text-lg" size="lg" disabled={!formData.category}>
            Cập nhật sản phẩm
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>Hủy</Button>
        </div>
      </form>
    </div>
  )
}
