// This file AUTOMATICALLY creates all 44 ROIs!
// Based on your template's layout, not random guessing

export const generateROIs = (imageWidth, imageHeight) => {
  console.log(`Generating ROIs for image size: ${imageWidth}x${imageHeight}`);
  
  // ===========================================
  // SECTION 1: AUTO-GENERATE ANSWER BOXES (32)
  // They're in a perfect grid pattern!
  // ===========================================
  
  // Based on your template, answer boxes start here
  const answerStartX = Math.round(imageWidth * 0.1);    // 10% from left
  const answerStartY = Math.round(imageHeight * 0.3);   // 30% from top
  const boxWidth = Math.round(imageWidth * 0.06);       // 6% of image width
  const boxHeight = Math.round(imageHeight * 0.04);      // 4% of image height
  const columnGap = Math.round(imageWidth * 0.15);       // Gap between columns
  const rowGap = Math.round(imageHeight * 0.01);         // Small gap between rows
  
  const answerBoxes = [];
  
  // Left column: Questions 1-16
  for (let row = 0; row < 16; row++) {
    const y = answerStartY + (row * (boxHeight + rowGap));
    
    answerBoxes.push({
      id: `Q${row + 1}`,
      type: 'answer',
      x: answerStartX,
      y: y,
      width: boxWidth,
      height: boxHeight,
      color: 'rgba(0, 255, 0, 0.3)', // Green for answers
      label: `Question ${row + 1}`
    });
  }
  
  // Right column: Questions 17-32
  for (let row = 0; row < 16; row++) {
    const y = answerStartY + (row * (boxHeight + rowGap));
    const questionNumber = row + 17;
    
    answerBoxes.push({
      id: `Q${questionNumber}`,
      type: 'answer',
      x: answerStartX + boxWidth + columnGap,
      y: y,
      width: boxWidth,
      height: boxHeight,
      color: 'rgba(0, 255, 0, 0.3)', // Green for answers
      label: `Question ${questionNumber}`
    });
  }
  
  // ===========================================
  // SECTION 2: STUDENT INFO BOXES
  // These are in the top section
  // ===========================================
  
  const studentStartY = Math.round(imageHeight * 0.1); // 10% from top
  
  const studentBoxes = [
    {
      id: 'surname',
      type: 'student',
      x: Math.round(imageWidth * 0.1),
      y: studentStartY,
      width: Math.round(imageWidth * 0.2),
      height: Math.round(imageHeight * 0.04),
      color: 'rgba(0, 100, 255, 0.3)', // Blue for student
      label: 'Surname'
    },
    {
      id: 'name',
      type: 'student',
      x: Math.round(imageWidth * 0.1),
      y: studentStartY + Math.round(imageHeight * 0.06),
      width: Math.round(imageWidth * 0.2),
      height: Math.round(imageHeight * 0.04),
      color: 'rgba(0, 100, 255, 0.3)',
      label: 'Name'
    },
    {
      id: 'class',
      type: 'student',
      x: Math.round(imageWidth * 0.1),
      y: studentStartY + Math.round(imageHeight * 0.12),
      width: Math.round(imageWidth * 0.1),
      height: Math.round(imageHeight * 0.04),
      color: 'rgba(0, 100, 255, 0.3)',
      label: 'Class'
    },
    {
      id: 'date',
      type: 'student',
      x: Math.round(imageWidth * 0.4),
      y: studentStartY,
      width: Math.round(imageWidth * 0.15),
      height: Math.round(imageHeight * 0.04),
      color: 'rgba(0, 100, 255, 0.3)',
      label: 'Date'
    }
  ];
  
  // ===========================================
  // SECTION 3: CHECKBOXES (bottom)
  // ===========================================
  
  const checkboxStartY = Math.round(imageHeight * 0.8); // 80% from top
  const checkboxSize = Math.round(imageWidth * 0.03);   // 3% of image width
  
  const checkboxes = [];
  for (let i = 0; i < 6; i++) {
    checkboxes.push({
      id: `checkbox${i + 1}`,
      type: 'checkbox',
      x: Math.round(imageWidth * (0.1 + (i * 0.08))),
      y: checkboxStartY,
      width: checkboxSize,
      height: checkboxSize,
      color: 'rgba(255, 255, 0, 0.4)', // Yellow for checkboxes
      label: `Note ${i + 1}`
    });
  }
  
  // ===========================================
  // COMBINE ALL ROIs
  // ===========================================
  
  const allROIs = [
    ...studentBoxes,
    ...answerBoxes,
    ...checkboxes
  ];
  
  console.log(`Generated ${allROIs.length} ROIs automatically!`);
  console.log(`- ${studentBoxes.length} student boxes`);
  console.log(`- ${answerBoxes.length} answer boxes`);
  console.log(`- ${checkboxes.length} checkboxes`);
  
  return {
    rois: allROIs,
    metadata: {
      imageWidth,
      imageHeight,
      generatedAt: new Date().toISOString()
    }
  };
};

// Helper function to adjust ROIs if needed
export const adjustROI = (rois, roiId, adjustments) => {
  return rois.map(roi => {
    if (roi.id === roiId) {
      return { ...roi, ...adjustments };
    }
    return roi;
  });
};