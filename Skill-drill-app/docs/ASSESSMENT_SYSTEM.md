# Assessment System Documentation

## Overview

The Skill Drill mobile app features a comprehensive scenario-based assessment system that evaluates users' skills through real-world scenarios and AI-generated prompts. The system is designed to provide personalized, adaptive assessments that match the user's career stage and role.

## Architecture

### Frontend Components

#### 1. Assessment Screen (`app/assessment.tsx`)
The main assessment interface with three distinct views:
- **Start Screen**: Introduction and assessment overview
- **Scenario Screen**: Interactive scenario-based questions
- **Completion Screen**: Submission confirmation and summary

#### 2. Assessment Session Hook (`hooks/useAssessmentSession.ts`)
Custom hook that manages:
- Session state and persistence
- Timer management
- Auto-save functionality
- Memory leak prevention
- API communication

#### 3. Assessment Results Component (`components/AssessmentResults.tsx`)
Displays detailed assessment results including:
- Score breakdown
- Sub-skill analysis
- Recommendations
- Progress tracking

### Backend Integration

The assessment system integrates with the backend API endpoints:

```
POST /assessment/session/start
GET /assessment/session/:sessionId/current
POST /assessment/session/:sessionId/next
POST /assessment/response/bulk
GET /assessment/results/:assessmentId
```

## Key Features

### 1. Session Persistence
- **Auto-save**: Sessions are automatically saved every 30 seconds
- **Resume capability**: Users can resume assessments after app closure
- **Session validation**: 24-hour session expiration
- **State restoration**: Complete state recovery on app restart

### 2. Memory Leak Prevention
- **Proper cleanup**: All timers and intervals are cleaned up on unmount
- **Ref management**: Uses refs to track and clear timeouts/intervals
- **Effect cleanup**: Proper useEffect cleanup functions
- **State optimization**: Minimal re-renders through useCallback

### 3. Timer Management
- **60-minute countdown**: Configurable assessment duration
- **Auto-submit**: Automatic submission when time expires
- **Visual feedback**: Real-time timer display
- **Pause/resume**: Timer pauses when app is backgrounded

### 4. Scenario-Based Assessment
- **Real-world scenarios**: Contextual, practical questions
- **Text responses**: Detailed written answers
- **Character limits**: Configurable response limits
- **Progress tracking**: Visual progress indicators

### 5. AI-Generated Content
- **Personalized prompts**: Based on user career stage and role
- **Dynamic scenarios**: Fresh content for each assessment
- **Skill-specific**: Tailored to selected skills
- **Fallback system**: Graceful degradation when AI is unavailable

## User Flow

### 1. Skill Selection
```
User selects skills → Navigate to assessment → Start session
```

### 2. Assessment Process
```
Start screen → Scenario questions → Submit responses → Next assessment
```

### 3. Session Management
```
Auto-save → Resume capability → Timer management → Completion
```

### 4. Results Display
```
Score calculation → Detailed breakdown → Recommendations → Next steps
```

## State Management

### Session State
```typescript
interface AssessmentSession {
  sessionId: string;
  currentAssessment: any;
  currentScenario: number;
  timeRemaining: number;
  startTime: number;
  timestamp: number;
}
```

### Response State
```typescript
interface AssessmentResponse {
  [promptId: string]: string;
}
```

## Error Handling

### Network Errors
- Automatic retry mechanisms
- Graceful degradation
- User-friendly error messages
- Offline state handling

### Session Errors
- Session validation
- Expired session cleanup
- State recovery
- Fallback to new session

### API Errors
- Proper error codes
- Retry logic
- User feedback
- Error logging

## Performance Optimizations

### 1. Memory Management
- Proper cleanup of timers and intervals
- Minimal state updates
- Efficient re-renders
- Memory leak prevention

### 2. Network Optimization
- Bulk response submission
- Efficient API calls
- Request caching
- Error recovery

### 3. UI Performance
- Smooth animations
- Efficient scrolling
- Optimized rendering
- Responsive design

## Security Features

### 1. Session Security
- Secure session tokens
- Session expiration
- Token refresh
- Secure storage

### 2. Data Protection
- Encrypted storage
- Secure API communication
- Data validation
- Privacy compliance

## Configuration

### Assessment Settings
```typescript
const ASSESSMENT_CONFIG = {
  duration: 3600, // 60 minutes in seconds
  autoSaveInterval: 30000, // 30 seconds
  sessionExpiry: 24 * 60 * 60 * 1000, // 24 hours
  minResponseLength: 100, // characters
  maxResponseLength: 2000 // characters
};
```

### Timer Settings
```typescript
const TIMER_CONFIG = {
  updateInterval: 1000, // 1 second
  warningThreshold: 300, // 5 minutes
  autoSubmitThreshold: 0 // immediate
};
```

## Usage Examples

### Starting an Assessment
```typescript
const { startSession } = useAssessmentSession();

const handleStartAssessment = async () => {
  try {
    await startSession(selectedSkillIds);
    // Navigate to assessment screen
  } catch (error) {
    // Handle error
  }
};
```

### Managing Responses
```typescript
const { updateUserResponse, submitResponses } = useAssessmentSession();

const handleSubmit = async () => {
  try {
    const result = await submitResponses();
    if (result.completed) {
      // Show completion screen
    } else {
      // Continue to next assessment
    }
  } catch (error) {
    // Handle error
  }
};
```

### Session Persistence
```typescript
const { loadSavedSession } = useAssessmentSession();

useEffect(() => {
  const initSession = async () => {
    const restored = await loadSavedSession();
    if (restored) {
      // Resume existing session
    } else {
      // Start new session
    }
  };
  initSession();
}, []);
```

## Testing

### Unit Tests
- Hook functionality
- State management
- Timer accuracy
- Error handling

### Integration Tests
- API communication
- Session persistence
- User flow
- Error scenarios

### Performance Tests
- Memory usage
- Timer accuracy
- Network efficiency
- UI responsiveness

## Troubleshooting

### Common Issues

1. **Session not resuming**
   - Check AsyncStorage permissions
   - Verify session expiration
   - Clear and restart session

2. **Timer not working**
   - Check timer cleanup
   - Verify useEffect dependencies
   - Restart assessment

3. **Responses not saving**
   - Check network connectivity
   - Verify API endpoints
   - Check response format

4. **Memory leaks**
   - Verify cleanup functions
   - Check ref management
   - Monitor memory usage

### Debug Tools
- Console logging
- React DevTools
- Performance monitoring
- Network debugging

## Future Enhancements

### Planned Features
- Offline assessment capability
- Advanced analytics
- Peer comparison
- Certification system
- Adaptive difficulty

### Technical Improvements
- Enhanced caching
- Better error recovery
- Performance optimization
- Accessibility improvements

## Support

For technical support or questions about the assessment system, please refer to:
- API documentation
- Component documentation
- Error logs
- Performance metrics

