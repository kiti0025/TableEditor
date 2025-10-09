/**
 * URL工具函数，用于处理URL参数解析和自动加载表格预览
 */

/**
 * 解析URL查询参数
 * @returns 包含所有URL参数的对象
 */
export function parseUrlParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const urlParams = new URLSearchParams(window.location.search);
  
  urlParams.forEach((value, key) => {
    params[key] = decodeURIComponent(value);
  });
  
  return params;
}

/**
 * 获取客户名称（param2）
 * @returns 客户名称
 */
export function getCustomerName(): string | null {
  const params = parseUrlParams();
  return params.param2 || null;
}

/**
 * 产品信息接口
 */
export interface ProductInfo {
  productName: string;    // 完整产品名称（如：凝胶眼膜彩盒-6g*8对）
  totalQuantity: string; // 总数量
  workOrderNumber: string; // 工单号
}

/**
 * 解析param3参数，提取多组产品信息
 * @returns 产品信息数组
 */
export function parseProductInfo(): ProductInfo[] {
  const params = parseUrlParams();
  const param3 = params.param3;
  
  if (!param3) {
    console.log('URL中未找到param3参数');
    return [];
  }
  
  console.log('原始param3:', param3);
  
  // 按逗号分割不同的产品组
  const productGroups = param3.split(',');
  const products: ProductInfo[] = [];
  
  productGroups.forEach((group, index) => {
    // 每组格式: 产品名称:总数量:工单号
    const parts = group.split(':');
    if (parts.length >= 3) {
      const productName = parts[0].trim();     // 完整产品名称
      const totalQuantity = parts[1].trim();  // 总数量
      const workOrderNumber = parts[2].trim(); // 工单号
      
      products.push({
        productName,
        totalQuantity,
        workOrderNumber
      });
      
      console.log(`产品${index + 1}:`, { productName, totalQuantity, workOrderNumber });
    }
  });
  
  console.log(`解析出${products.length}个产品`);
  return products;
}

/**
 * 构建文件名
 * @param customerName 客户名称
 * @returns JSON文件名
 */
export function buildFileName(customerName: string): string {
  // 移除文件名中的非法字符
  const sanitizedName = customerName.replace(/[\\/:*?"<>|]/g, '');
  return `${sanitizedName}.json`;
}

/**
 * 根据URL参数自动加载表格并生成多个预览
/**
 * 根据URL参数自动加载表格并生成多个预览
 * @param loadTableFunction 加载表格的函数
 * @param createMultiPreviewFunction 创建多预览的函数（将在Preview.vue中独立进行预置文本替换）
 * @param dataRefresher DataRefresher组件引用（用于更新预置文本）
 * @returns Promise<boolean> 是否成功
 */
export async function autoLoadAndMultiPreview(
  loadTableFunction: (filename: string) => Promise<void>,
  createMultiPreviewFunction: (products: ProductInfo[]) => void,
  dataRefresher?: any
): Promise<boolean> {
  try {
    const customerName = getCustomerName();
    
    if (!customerName) {
      console.log('URL中未找到客户名称参数(param2)');
      return false;
    }
    
    console.log('检测到客户名称:', customerName);
    
    // 解析产品信息
    const products = parseProductInfo();
    if (products.length === 0) {
      console.log('未解析到产品信息，使用单预览模式');
      return false;
    }
    
    const fileName = buildFileName(customerName);
    console.log('尝试加载文件:', fileName);
    
    // 加载表格
    await loadTableFunction(fileName);
    console.log('表格加载完成，开始更新预置文本并创建多预览...');
    
    // 如果提供了dataRefresher，先更新预置文本默认值（使用第一个产品的信息）
    if (dataRefresher?.updatePresetTextFromUrlParams) {
      console.log('开始更新预置文本默认值...');
      dataRefresher.updatePresetTextFromUrlParams(products[0]);
    }
    
    // 在预览前刷新所有预置文本（包括合格状态、当前时间等）
    if (dataRefresher?.refreshAllPresetTextsForPreview) {
      console.log('开始刷新所有预置文本为预览做准备...');
      dataRefresher.refreshAllPresetTextsForPreview();
    }
    
    // 延迟一下再创建多预览，确保表格加载完成
    setTimeout(() => {
      createMultiPreviewFunction(products);
      console.log(`已创建${products.length}个预览`);
    }, 300);
    
    return true;
  } catch (error) {
    console.error('自动加载和多预览失败:', error);
    return false;
  }
}

/**
 * 兼容原有的单预览功能
 */
export async function autoLoadAndPreview(
  loadTableFunction: (filename: string) => Promise<void>,
  previewFunction: () => void
): Promise<boolean> {
  try {
    const customerName = getCustomerName();
    
    if (!customerName) {
      console.log('URL中未找到客户名称参数(param2)');
      return false;
    }
    
    console.log('检测到客户名称:', customerName);
    
    const fileName = buildFileName(customerName);
    console.log('尝试加载文件:', fileName);
    
    // 加载表格
    await loadTableFunction(fileName);
    console.log('表格加载完成，等待后触发预览...');
    
    // 延迟一下再触发预览，确保表格加载完成
    setTimeout(() => {
      previewFunction();
      console.log('已自动触发预览');
    }, 300);
    
    return true;
  } catch (error) {
    console.error('自动加载和预览失败:', error);
    return false;
  }
}