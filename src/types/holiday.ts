export interface Holiday {
  id?: string;  // Optional cho việc tạo mới
  name: string;
  description?: string; // Thêm mô tả (không bắt buộc)

  // Có thể là một ngày hoặc một khoảng
  startDate: string; // ISO string
  endDate?: string;  // Optional nếu chỉ có 1 ngày

  isRecurring?: boolean; // Có lặp lại hằng năm không (dùng cho lễ tĩnh)
  type?: 'static' | 'dynamic'; // 'static' = lễ cố định (1/1, 30/4...), 'dynamic' = tuỳ năm (Tết âm, lễ bù...)

  isActive?: boolean; // Trạng thái của ngày nghỉ (mặc định là true)
  createdAt?: string; // Thời gian tạo
  updatedAt?: string; // Thời gian cập nhật
} 