// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import top from '../../public/basic_info_top.png';
import { EnvironmentOutlined } from '@ant-design/icons';
import { Picker, Dialog } from 'antd-mobile';
import { updateUserProfile, getCurrentUser } from '../../config';
/**
 * 高考志愿信息完善页面
 * 严格按照设计图尺寸、字体、间距等实现
 * 使用 Tailwind CSS 进行样式控制
 */
const firstSubjects = [
  { label: '物理', value: '物理' },
  { label: '历史', value: '历史' },
];
//新疆、西藏
const firstSubjects2 = [
  { label: '文科', value: '文科' },
  { label: '理科', value: '理科' },
];
const secondSubjects = [
  { label: '化学', value: '化学' },
  { label: '生物', value: '生物' },
  { label: '政治', value: '政治' },
  { label: '地理', value: '地理' },
];

//所有学科
const allSubjects = [
  { label: '物理', value: '物理' },
  { label: '化学', value: '化学' },
  { label: '生物', value: '生物' },
  { label: '历史', value: '历史' },
  { label: '政治', value: '政治' },
  { label: '地理', value: '地理' },
];

// 按拼音首字母排序的省份列表
const provinces = [
  '安徽',
  '北京',
  '重庆',
  '福建',
  '甘肃',
  '广东',
  '广西',
  '贵州',
  '海南',
  '河北',
  '河南',
  '黑龙江',
  '湖北',
  '湖南',
  '吉林',
  '江苏',
  '江西',
  '辽宁',
  '内蒙古',
  '宁夏',
  '青海',
  '山东',
  '山西',
  '陕西',
  '上海',
  '四川',
  '天津',
  '西藏',
  '新疆',
  '云南',
  '浙江',
];

const BasicInfo: React.FC = () => {
  const navigator = useNavigate();
  // 省份、科目、分数、排名等状态
  const [province, setProvince] = useState('北京');
  const [firstSubject, setFirstSubject] = useState('');
  const [secondSubject, setSecondSubject] = useState<string[]>([]);
  const [score, setScore] = useState('');
  const [rank, setRank] = useState('');
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const userStr = localStorage.getItem('new-user');
  console.log(userStr);
  const scaleAnswerCount = localStorage.getItem('scaleAnswerCount');
  useEffect(() => {
    const getUserInfo = async () => {
      const user = await getCurrentUser();
      if (user.code == 200 && user.data) {
        if (user.data.province) {
          setProvince(user.data.province);
        }
        if (user.data.preferredSubjects) {
          setFirstSubject(user.data.preferredSubjects);
        }
        if (user.data.secondarySubjects) {
          setSecondSubject(user.data.secondarySubjects.split(','));
        }
        if (user.data.score) {
          setScore(user.data.score);
        }
        if (user.data.rank) {
          setRank(user.data.rank);
        }
      }
    };
    getUserInfo();
  }, []);

  const updateProfile = async () => {
    let firstSubjectTemp = firstSubject;
    if (!userStr) {
      return;
    }
    const user = JSON.parse(userStr);
    const userId = user?.id ?? user?.data?.id;

    if (!score || !rank || !province) {
      Dialog.alert({
        content: '请填写完整信息',
        onConfirm: () => {
          console.log('Confirmed');
        },
      });
      return;
    }
    if (
      province === '北京' ||
      province === '天津' ||
      province === '上海' ||
      province === '山东' ||
      province === '海南' ||
      province === '浙江'
    ) {
      if (secondSubject.length !== 3) {
        Dialog.alert({
          content: '请选择3个科目',
          onConfirm: () => {
            console.log('Confirmed');
          },
        });
        return;
      }
      firstSubjectTemp = '综合';
    } else if (province === '新疆' || province === '西藏') {
      if (firstSubject === '') {
        Dialog.alert({
          content: '请选择文科或理科',
          onConfirm: () => {
            console.log('Confirmed');
          },
        });
        return;
      }
    } else {
      if (firstSubject === '') {
        Dialog.alert({
          content: '请选择一门首选科目',
          onConfirm: () => {
            console.log('Confirmed');
          },
        });
        return;
      } else {
        if (secondSubject.length !== 2) {
          Dialog.alert({
            content: '请选择2门可选科目',
            onConfirm: () => {
              console.log('Confirmed');
            },
          });
          return;
        }
      }
    }
    try {
      const gaokaoConfigResponse = await updateUserProfile(userId, {
        province: province,
        preferredSubjects: firstSubjectTemp,
        secondarySubjects: secondSubject.join(','),
        score: Number(score),
        rank: Number(rank),
      });
      if (gaokaoConfigResponse && gaokaoConfigResponse.code === 200) {
        console.log(scaleAnswerCount, 'scaleAnswerCount');
        if (scaleAnswerCount && Number(scaleAnswerCount) !== 168) {
          Dialog.alert({
            content: '考生信息更新成功，请填写自评问卷',
            confirmText: '填写自评问卷',
            onConfirm: () => {
              navigator('/major/list');
            },
          });
        } else {
          Dialog.confirm({
            content: '考生信息更新成功',
            confirmText: '查看专业报告',
            cancelText: '重做自评',
            onConfirm: () => {
              navigator('/major/list');
            },
            onCancel: () => {
              navigator('/assessment/scale168');
            },
          });
        }
      }
    } catch (error) {
      console.error('考生信息更新失败:', error);
    }
  };

  /**
   * 处理分数输入，只允许大于0的整数
   */
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许数字输入且大于0
    if (/^\d+$/.test(value) && parseInt(value) > 0) {
      setScore(value);
    } else if (value === '') {
      // 允许清空输入框
      setScore(value);
    }
  };

  /**
   * 处理排名输入，只允许大于0的整数
   */
  const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许数字输入且大于0
    if (/^\d+$/.test(value) && parseInt(value) > 0) {
      setRank(value);
    } else if (value === '') {
      // 允许清空输入框
      setRank(value);
    }
  };

  /**
   * 处理第二科目选择（4选2）
   */
  const handleSecondSubjectSelect = (value: string) => {
    setSecondSubject((prev) => {
      if (prev.includes(value)) {
        console.log(prev, 'prev');
        // 如果已选中，则取消选择
        return prev.filter((item) => item !== value);
      } else {
        console.log(prev.length, 'prev');
        console.log(prev, 'value');
        // 如果未选中且未达到2个，则添加
        if (prev.length < 2) {
          return [...prev, value];
        }
        // 如果已达到2个，则替换最后一个
        return [...prev.slice(0, 1), value];
      }
    });
  };
  /**
   * 处理任选三科
   */
  const handleThreeSubjectSelect = (value: string) => {
    setSecondSubject((prev) => {
      if (prev.includes(value)) {
        // 如果已选中，则取消选择
        return prev.filter((item) => item !== value);
      } else {
        // 如果未选中且未达到3个，则添加
        if (prev.length < 3) {
          return [...prev, value];
        }
        // 如果已达到2个，则替换最后一个
        return [...prev.slice(0, 2), value];
      }
    });
  };

  /**
   * 提交表单
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 提交逻辑
    alert('提交成功！');
  };

  //选择科目的html
  const renderSubjectDom = () => {
    if (province === '新疆' || province === '西藏') {
      return (
        <div className="w-full mt-2 mb-1 flex flex-col items-center">
          <div className="flex gap-3 w-full">
            {firstSubjects2.map((subj) => (
              <button
                type="button"
                key={subj.value}
                className={`flex-1 h-[44px] rounded-full text-[18px] font-medium transition-all
                    ${firstSubject === subj.value ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600'}
                  `}
                onClick={() => setFirstSubject(subj.value)}
              >
                {subj.label}
              </button>
            ))}
          </div>
        </div>
      );
    } else if (
      province === '北京' ||
      province === '天津' ||
      province === '上海' ||
      province === '山东' ||
      province === '海南' ||
      province === '浙江'
    ) {
      const subjectsTemp = [...allSubjects];
      if (province === '浙江') {
        subjectsTemp.push({ label: '技术', value: '技术' });
      }

      return (
        <div className="w-full mt-2 mb-1 flex flex-col items-center">
          <div className="flex items-center w-full mb-2 justify-center">
            <div className="flex-1 h-px bg-gray-300" style={{ maxWidth: '40px' }} />
            <span className="text-gray-400 text-[13px] mx-3 whitespace-nowrap">选择 3 个</span>
            <div className="flex-1 h-px bg-gray-300" style={{ maxWidth: '40px' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 w-full pb-3">
            {subjectsTemp.map((subj, index) => {
              if (index < 3) {
                return (
                  <button
                    type="button"
                    key={subj.value}
                    className={`h-[44px] rounded-full text-[18px] font-medium transition-all
                              ${secondSubject.includes(subj.value) ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600'}
                            `}
                    onClick={() => handleThreeSubjectSelect(subj.value)}
                  >
                    {subj.label}
                  </button>
                );
              }
            })}
          </div>
          <div
            className={
              province === '浙江'
                ? 'grid grid-cols-4 gap-3 w-full'
                : 'grid grid-cols-3 gap-3 w-full'
            }
          >
            {subjectsTemp.map((subj, index) => {
              if (index >= 3) {
                return (
                  <button
                    type="button"
                    key={subj.value}
                    className={`h-[44px] rounded-full text-[18px] font-medium transition-all
                              ${secondSubject.includes(subj.value) ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600'}
                            `}
                    onClick={() => handleThreeSubjectSelect(subj.value)}
                  >
                    {subj.label}
                  </button>
                );
              }
            })}
          </div>
        </div>
      );
    } else {
      return (
        <>
          {/* 首选分组 */}
          <div className="w-full mt-2 mb-1 flex flex-col items-center">
            <div className="flex items-center w-full mb-2 justify-center">
              <div className="flex-1 h-px bg-gray-300" style={{ maxWidth: '40px' }} />
              <span className="text-gray-400 text-[13px] mx-3 whitespace-nowrap">首选（2选1）</span>
              <div className="flex-1 h-px bg-gray-300" style={{ maxWidth: '40px' }} />
            </div>
            <div className="flex gap-3 w-full">
              {firstSubjects.map((subj) => (
                <button
                  type="button"
                  key={subj.value}
                  className={`flex-1 h-[44px] rounded-full text-[18px] font-medium transition-all
                    ${firstSubject === subj.value ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600'}
                  `}
                  onClick={() => setFirstSubject(subj.value)}
                >
                  {subj.label}
                </button>
              ))}
            </div>
          </div>
          {/* 可选分组 */}
          <div className="w-full mt-3 flex flex-col items-center">
            <div className="flex items-center justify-center w-full mb-2">
              <div className="flex-1 h-px bg-gray-300" style={{ maxWidth: '40px' }} />
              <span className="text-gray-400 text-[13px] mx-3 whitespace-nowrap">可选（4选2）</span>
              <div className="flex-1 h-px bg-gray-300" style={{ maxWidth: '40px' }} />
            </div>
            <div className="grid grid-cols-4 gap-3 w-full">
              {secondSubjects.map((subj) => (
                <button
                  type="button"
                  key={subj.value}
                  className={`h-[44px] rounded-full text-[18px] font-medium transition-all
                    ${secondSubject.includes(subj.value) ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600'}
                  `}
                  onClick={() => handleSecondSubjectSelect(subj.value)}
                >
                  {subj.label}
                </button>
              ))}
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr  bg-color-[rgb(96.5,96.5,96.5)] flex flex-col items-center">
      {/* 顶部插画与标题 */}
      <div className="w-full flex flex-col items-center pb-4">
        <img src={top} alt="顶部插画" className="w-[100vw] h-[auto] object-cover" />
      </div>

      {/* 信息表单卡片 */}
      <form
        className="w-[92vw] max-w-[420px] bg-white rounded-2xl shadow-lg px-6 py-6 flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        {/* 高考省份 */}
        <div className="flex items-center justify-between border-b border-gray-200">
          <label className="text-gray-900 text-[16px]">高考省份</label>
          <div className="flex items-center gap-2">
            <div
              className="h-[40px] rounded-lg  text-[16px] flex items-center justify-end cursor-pointer min-w-[120px]"
              onClick={() => setShowProvincePicker(true)}
            >
              {province}
            </div>
            <EnvironmentOutlined className="text-gray-400 text-[20px]" />
          </div>
        </div>

        {/* 选择科目 */}
        <div>
          <label className="text-gray-900 text-[16px]">选择科目</label>
          {renderSubjectDom()}
        </div>

        {/* 分数与排名 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-gray-200">
            <label className="text-gray-900 text-[16px]">预估或实际总分</label>
            <div className="flex items-center justify-end gap-2">
              <input
                type="text"
                inputMode="numeric"
                className="w-[120px] h-[36px] text-right  text-[16px] focus:outline-none"
                placeholder="请输入分数"
                value={score}
                onChange={handleScoreChange}
              />
              <span className="text-gray-900 text-[15px]">{'>>'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-gray-200">
            <label className="text-gray-900 text-[16px]">高考排名</label>
            <div className="flex items-center justify-end gap-2">
              <input
                type="text"
                inputMode="numeric"
                className="w-[120px] h-[36px] text-right  text-[16px] focus:outline-none"
                placeholder="请输入位次"
                value={rank}
                onChange={handleRankChange}
              />
              <span className="text-gray-900 text-[15px]">{'>>'}</span>
            </div>
          </div>
        </div>

        {/* 说明文字 */}
        <div className="text-[14px] mt-1 flex items-center">
          {/* <span className="text-blue-500 mr-1">*</span> */}
          {/* <span className="text-gray-400">2024年{province}高考一分一段 名</span> */}
        </div>
      </form>

      {/* 确认按钮 */}
      <button
        className="w-[92vw] max-w-[420px] h-[56px] bg-blue-600 text-white text-[22px] font-bold rounded-full mt-8 shadow-lg active:bg-blue-600 transition-all"
        style={{ letterSpacing: '2px' }}
        type="submit"
        onClick={() => updateProfile()}
        form=""
      >
        确认
      </button>

      {/* 底部提示 */}
      <div className="text-gray-500 text-[12px] text-center mt-4 mb-2 px-2">
        系统仅支持普通类常规批次考生，暂不支持艺体生，提前批等特殊批次考生。
      </div>

      {/* 省份选择器 */}
      <Picker
        columns={[provinces]}
        visible={showProvincePicker}
        onClose={() => setShowProvincePicker(false)}
        onConfirm={(value) => {
          if (value && value[0]) {
            setProvince(String(value[0]));
          }
          setShowProvincePicker(false);
          setFirstSubject('');
          setSecondSubject([]);
          setScore('');
          setRank('');
        }}
        title="选择省份"
      />
    </div>
  );
};

export default BasicInfo;
