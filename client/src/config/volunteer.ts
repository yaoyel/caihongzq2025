import axios from 'axios';

// 从环境变量中获取API主机地址
const getApiHost = () => {
  // 优先使用环境变量
  if (import.meta.env && import.meta.env.VITE_API_HOST) {
    return import.meta.env.VITE_API_HOST;
  }

  // 如果没有环境变量，则根据当前域名判断
  return window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://caihongzq.com:3000';
};

export const config = {
  apiHost: getApiHost(),
  apiPrefix: '/api',
};

export const getApiUrl = (path: string) => {
  // 确保path以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.apiHost}${config.apiPrefix}${normalizedPath}`;
};

export const api = {
  baseURL: '/api',
  endpoints: {
    scales: '/scales',
    questions: '/questions',
    // 专业收藏接口
    majorIntention: (majorCode: string) => `/majors/intention/${majorCode}`,
    // 查询收藏列表接口
    majorIntentions: '/majors/intentions',
    // 获取所有备选志愿接口
    majorAlternatives: '/majors/alternatives',
    // 创建备选志愿接口
    createMajorAlternative: '/majors/alternative',
    // 选入志愿接口
    selectAlternative: (alternativeId: string) => `/majors/alternative/${alternativeId}/select`,
    // 取消志愿接口
    unselectAlternative: (alternativeId: string) => `/majors/alternative/${alternativeId}/unselect`,
    // 取消备注接口
    cancelAlternative: (alternativeId: string) => `/majors/alternative/${alternativeId}`,
    // 上移志愿接口
    moveUpAlternative: (alternativeId: string) => `/majors/alternative/${alternativeId}/move-up`,
    // 下移志愿接口
    moveDownAlternative: (alternativeId: string) => `/majors/alternative/${alternativeId}/move-down`,
    // 查询专业组接口
    majorGroup: (majorGroupId: string) => `/majors/group/${majorGroupId}`,
    // 查询招生简章接口
    schoolCharters: (schoolCode: string) => `/schools/${schoolCode}/charters`,
  },
};

// 专业收藏接口类型定义
interface MajorIntentionResponse {
  code: number;
  message: string;
  data?: {
    majorCode: string;
    isIntention: boolean;
  };
}

// 添加一个辅助函数来设置请求头
export const getAuthHeaders = () => {
  const token = localStorage.getItem('new-token');
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
};
/**
 * 收藏/取消收藏专业
 * @param majorCode 专业代码
 * @returns Promise<MajorIntentionResponse>
 */
export const toggleMajorIntention = async (majorCode: string): Promise<MajorIntentionResponse> => {
  try {
    const response = await axios.post<MajorIntentionResponse>(
      getApiUrl(api.endpoints.majorIntention(majorCode)),
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '收藏专业操作失败');
    }
    throw error;
  }
};

/**
 * 取消收藏专业
 * @param majorCode 专业代码
 * @returns Promise<MajorIntentionResponse>
 */
export const cancelMajorIntention = async (majorCode: string): Promise<MajorIntentionResponse> => {
  try {
    const response = await axios.delete<MajorIntentionResponse>(
      getApiUrl(api.endpoints.majorIntention(majorCode)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '取消收藏专业失败');
    }
    throw error;
  }
};

// 收藏列表接口类型定义
interface MajorIntentionItem {
  majorCode: string;
  majorName: string;
  isIntention: boolean;
  createdAt: string;
  score?: number; // 热爱能量分数
  group0?: number; // 其他位次段院校数量
  group1?: number; // （+5%到+10%）位次段院校数量
  group2?: number; // （-5%）到+（+5%）位次段院校数量
  group3?: number; // （-15%） 到 （-5%）位次段院校数量
  lexueScore?: string; // 乐学分数
  shanxueScore?: string; // 善学分数
  yanxueDeduction?: string; // 厌学扣分
  tiaozhanDeduction?: string; // 挑战扣分
  opportunityScore?: string; // 机会分数
  academicDevelopmentScore?: string; // 学术发展分数
  careerDevelopmentScore?: string; // 职业发展分数
  growthPotentialScore?: string; // 成长潜力分数
  industryProspectsScore?: string; // 行业前景分数
  developmentPotential?: string; // 发展潜力
}

interface MajorIntentionsResponse {
  code: number;
  message: string;
  data: MajorIntentionItem[];
}

/**
 * 查询用户收藏的专业列表
 * @returns Promise<MajorIntentionsResponse>
 */
export const getMajorIntentions = async (): Promise<MajorIntentionsResponse> => {
  try {
    const response = await axios.get<MajorIntentionsResponse>(
      getApiUrl(api.endpoints.majorIntentions),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取收藏专业列表失败');
    }
    throw error;
  }
};

// 备选志愿接口类型定义
interface MajorAlternativeItem {
  id?: number;
  majorCode: string;
  majorName: string;
  schoolCode: string;
  schoolName: string;
  priority?: number;
  createdAt: string;
  score?: number;
  selected?: boolean;
  historyScore?: any;
  group?: number;
  admissionsSite?: string; // 招生网址
  admissionsPhone?: string; // 招生电话
}

interface MajorAlternativesResponse {
  code: number;
  message: string;
  data: {
    total: number;
    data: MajorAlternativeItem[];
    currentPage: number;
    totalPages: number;
    volunteerCount: number;
    topDevelopmentCount: number;
  };
}

/**
 * 获取用户所有备选志愿
 * @returns Promise<MajorAlternativesResponse>
 */
export const getMajorAlternatives = async (): Promise<MajorAlternativesResponse> => {
  try {
    const response = await axios.get<MajorAlternativesResponse>(
      getApiUrl(api.endpoints.majorAlternatives),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取备选志愿列表失败');
    }
    throw error;
  }
};

// 创建备选志愿请求参数类型定义
interface HistoryScoreItem {
  [year: string]: string; // 例如: {"2024": "556,16019,20"}
}

interface CreateMajorAlternativeRequest {
  majorCode: string;
  majorName: string;
  schoolCode: string;
  schoolName: string;
  schoolFeature: string;
  historyScore: HistoryScoreItem[];
  group: string;
}

// 创建备选志愿响应类型定义
interface CreateMajorAlternativeResponse {
  code: number;
  message: string;
  data?: {
    id: string;
    majorCode: string;
    majorName: string;
    schoolCode: string;
    schoolName: string;
    priority: number;
    createdAt: string;
  };
}

/**
 * 创建备选志愿
 * @param data 备选志愿数据
 * @returns Promise<CreateMajorAlternativeResponse>
 */
export const createMajorAlternative = async (
  data: CreateMajorAlternativeRequest
): Promise<CreateMajorAlternativeResponse> => {
  try {
    const response = await axios.post<CreateMajorAlternativeResponse>(
      getApiUrl(api.endpoints.createMajorAlternative),
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '创建备选志愿失败');
    }
    throw error;
  }
};

// 选入/取消志愿响应类型定义
interface AlternativeActionResponse {
  code: number;
  message: string;
  data?: {
    alternativeId: string;
    isSelected: boolean;
    updatedAt: string;
  };
}

/**
 * 选入志愿
 * @param alternativeId 备选志愿ID
 * @returns Promise<AlternativeActionResponse>
 */
export const selectAlternative = async (alternativeId: string): Promise<AlternativeActionResponse> => {
  try {
    const response = await axios.post<AlternativeActionResponse>(
      getApiUrl(api.endpoints.selectAlternative(alternativeId)),
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '选入志愿失败');
    }
    throw error;
  }
};

/**
 * 取消志愿
 * @param alternativeId 备选志愿ID
 * @returns Promise<AlternativeActionResponse>
 */
export const unselectAlternative = async (alternativeId: string): Promise<AlternativeActionResponse> => {
  try {
    const response = await axios.post<AlternativeActionResponse>(
      getApiUrl(api.endpoints.unselectAlternative(alternativeId)),
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '取消志愿失败');
    }
    throw error;
  }
};

/**
 * 取消备注（删除备选志愿）
 * @param alternativeId 备选志愿ID
 * @returns Promise<AlternativeActionResponse>
 */
export const cancelAlternative = async (alternativeId: string): Promise<AlternativeActionResponse> => {
  try {
    const response = await axios.delete<AlternativeActionResponse>(
      getApiUrl(api.endpoints.cancelAlternative(alternativeId)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '取消备注失败');
    }
    throw error;
  }
};

// 专业组信息接口类型定义
interface MajorGroupItem {
  schoolCode: string;
  majorCode: string;
  subjectType: string;
  batch: string;
  num: string;
  enrollType: string;
  studyPeriod: string;
  province: string;
  tuition: string;
  remark: string;
  majorGroup: number;
  majorGroupInfo: string;
  majorGroupName: string;
  majorNameDetail: string;
  majorName: string;
  year: number;
}

interface MajorGroupResponse {
  code: number;
  message: string;
  data: MajorGroupItem[];
}

/**
 * 查询专业组信息
 * @param majorGroupId 专业组ID
 * @returns Promise<MajorGroupResponse>
 */
export const getMajorGroup = async (majorGroupId: string): Promise<MajorGroupResponse> => {
  try {
    const response = await axios.get<MajorGroupResponse>(
      getApiUrl(api.endpoints.majorGroup(majorGroupId)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '查询专业组信息失败');
    }
    throw error;
  }
};

/**
 * 上移志愿
 * @param alternativeId 备选志愿ID
 * @returns Promise<AlternativeActionResponse>
 */
export const moveUpAlternative = async (alternativeId: string): Promise<AlternativeActionResponse> => {
  try {
    const response = await axios.post<AlternativeActionResponse>(
      getApiUrl(api.endpoints.moveUpAlternative(alternativeId)),
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '上移志愿失败');
    }
    throw error;
  }
};

/**
 * 下移志愿
 * @param alternativeId 备选志愿ID
 * @returns Promise<AlternativeActionResponse>
 */
export const moveDownAlternative = async (alternativeId: string): Promise<AlternativeActionResponse> => {
  try {
    const response = await axios.post<AlternativeActionResponse>(
      getApiUrl(api.endpoints.moveDownAlternative(alternativeId)),
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '下移志愿失败');
    }
    throw error;
  }
};

// 招生简章接口类型定义
interface CharterItem {
  id: string;
  title: string; // 简章标题
  content: string; // 简章内容
  year: number; // 年份
  schoolCode: string; // 学校代码
  schoolName: string; // 学校名称
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

interface SchoolChartersResponse {
  code: number;
  message: string;
  data: CharterItem[];
}

/**
 * 查询学校招生简章
 * @param schoolCode 学校代码
 * @returns Promise<SchoolChartersResponse>
 */
export const getSchoolCharters = async (schoolCode: string): Promise<SchoolChartersResponse> => {
  try {
    const response = await axios.get<SchoolChartersResponse>(
      getApiUrl(api.endpoints.schoolCharters(schoolCode)),
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || '获取招生简章失败');
    }
    throw error;
  }
};
