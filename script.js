// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');

// File upload handling
selectFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files);
    }
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Process files
function handleFiles(files) {
    // Clear previous file list
    const existingList = uploadArea.querySelector('.file-list');
    if (existingList) {
        existingList.remove();
    }

    // Create file list container
    const fileList = document.createElement('div');
    fileList.className = 'file-list';

    Array.from(files).forEach(file => {
        const fileItem = createFileItem(file);
        fileList.appendChild(fileItem);
    });

    uploadArea.appendChild(fileList);

    // Show processing state
    uploadArea.classList.add('processing');
    
    // Simulate file processing (in real app, this would upload to server)
    setTimeout(() => {
        uploadArea.classList.remove('processing');
        uploadArea.classList.add('success');
        
        // Show conversion options
        showConversionOptions(files);
        
        // Reset after 3 seconds
        setTimeout(() => {
            uploadArea.classList.remove('success');
            fileList.remove();
        }, 3000);
    }, 2000);
}

// Create file item element
function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileSize = document.createElement('span');
    fileSize.className = 'file-size';
    fileSize.textContent = formatFileSize(file.size);
    
    fileItem.appendChild(fileName);
    fileItem.appendChild(fileSize);
    
    return fileItem;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Show conversion options
function showConversionOptions(files) {
    // In a real application, this would show a modal or form
    // to select the output format
    console.log('Files ready for conversion:', files);
    
    // You can add a modal here to select conversion format
    // For now, we'll just log the files
    alert('檔案已上傳！請選擇要轉換的格式。\n\n（此為示範版本，實際轉換功能需要後端服務）');
}

// Get file extension
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Check if file type is supported
function isSupportedFileType(filename) {
    const supportedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'];
    const extension = getFileExtension(filename);
    return supportedTypes.includes(extension);
}

// Validate files before processing
function validateFiles(files) {
    const invalidFiles = [];
    Array.from(files).forEach(file => {
        if (!isSupportedFileType(file.name)) {
            invalidFiles.push(file.name);
        }
    });
    
    if (invalidFiles.length > 0) {
        alert('以下檔案格式不支援：\n' + invalidFiles.join('\n'));
        return false;
    }
    
    return true;
}

// Update handleFiles to validate
function handleFiles(files) {
    if (!validateFiles(files)) {
        return;
    }

    // Clear previous file list
    const existingList = uploadArea.querySelector('.file-list');
    if (existingList) {
        existingList.remove();
    }

    // Create file list container
    const fileList = document.createElement('div');
    fileList.className = 'file-list';

    Array.from(files).forEach(file => {
        const fileItem = createFileItem(file);
        fileList.appendChild(fileItem);
    });

    uploadArea.appendChild(fileList);

    // Show processing state
    uploadArea.classList.add('processing');
    
    // Simulate file processing (in real app, this would upload to server)
    setTimeout(() => {
        uploadArea.classList.remove('processing');
        uploadArea.classList.add('success');
        
        // Show conversion options
        showConversionOptions(files);
        
        // Reset after 3 seconds
        setTimeout(() => {
            uploadArea.classList.remove('success');
            fileList.remove();
        }, 3000);
    }, 2000);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-spinner';
    loading.innerHTML = '<div class="spinner"></div><p>正在處理檔案...</p>';
    uploadArea.appendChild(loading);
}

function hideLoading() {
    const loading = uploadArea.querySelector('.loading-spinner');
    if (loading) {
        loading.remove();
    }
}

