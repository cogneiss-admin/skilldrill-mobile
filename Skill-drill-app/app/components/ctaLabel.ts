// @ts-nocheck
export function getSkillsCtaLabel({
  busy,
  isAddToAssessmentMode,
  isAssessmentMode,
  isFromCompleted,
  selectedCount,
}: {
  busy: boolean;
  isAddToAssessmentMode: boolean;
  isAssessmentMode: boolean;
  isFromCompleted: boolean;
  selectedCount: number;
}) {
  if (busy) {
    if (isAddToAssessmentMode) return 'Adding Skills...';
    if (isAssessmentMode) return 'Starting Assessment...';
    return 'Saving...';
  }

  if (selectedCount > 0) {
    if (isAddToAssessmentMode) return `Add ${selectedCount} Skill${selectedCount !== 1 ? 's' : ''} to Assessment`;
    if (isAssessmentMode) {
      if (isFromCompleted) return `Start New Assessment (${selectedCount} skill${selectedCount !== 1 ? 's' : ''})`;
      return `Start Assessment (${selectedCount} skill${selectedCount !== 1 ? 's' : ''})`;
    }
    return `Continue with ${selectedCount} Skill${selectedCount !== 1 ? 's' : ''}`;
  }

  if (isAddToAssessmentMode) return 'Select skills to add';
  if (isAssessmentMode) return isFromCompleted ? 'Select skills for new assessment' : 'Select skills to assess';
  return 'Select at least one skill';
}

export default getSkillsCtaLabel;


