/**
 * Assessment Flow Test Script
 * 
 * This script tests the assessment system flow to ensure everything works correctly.
 * Run this script to verify the assessment backend integration.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Test data
const TEST_SKILLS = [
  'communication',
  'leadership',
  'problem-solving'
];

class AssessmentTester {
  constructor() {
    this.accessToken = null;
    this.sessionId = null;
    this.assessmentId = null;
  }

  async login() {
    console.log('🔐 Logging in...');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (response.data.success) {
        this.accessToken = response.data.data.access_token;
        console.log('✅ Login successful');
        return true;
      } else {
        console.error('❌ Login failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return false;
    }
  }

  async startAssessmentSession() {
    console.log('🎯 Starting assessment session...');
    try {
      const response = await axios.post(`${API_BASE_URL}/assessment/session/start`, {
        skillIds: TEST_SKILLS
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.data.success) {
        this.sessionId = response.data.data.sessionId;
        this.assessmentId = response.data.data.currentAssessment.id;
        console.log('✅ Assessment session started');
        console.log('📊 Session ID:', this.sessionId);
        console.log('📝 Assessment ID:', this.assessmentId);
        return response.data.data;
      } else {
        console.error('❌ Failed to start session:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Session start error:', error.message);
      return null;
    }
  }

  async getCurrentAssessment() {
    console.log('📋 Getting current assessment...');
    try {
      const response = await axios.get(`${API_BASE_URL}/assessment/session/${this.sessionId}/current`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.data.success) {
        console.log('✅ Current assessment retrieved');
        console.log('📝 Assessment details:', {
          skill: response.data.data.assessment.skill?.skill_name,
          prompts: response.data.data.assessment.template?.prompts?.length || 0,
          status: response.data.data.assessment.status
        });
        return response.data.data;
      } else {
        console.error('❌ Failed to get assessment:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Get assessment error:', error.message);
      return null;
    }
  }

  async submitResponses() {
    console.log('📤 Submitting assessment responses...');
    try {
      // Get current assessment to see prompts
      const assessment = await this.getCurrentAssessment();
      if (!assessment) return false;

      const prompts = assessment.assessment.template.prompts;
      const responses = prompts.map((prompt, index) => ({
        promptId: prompt.id,
        response: `This is a test response for prompt ${index + 1}. I would provide a detailed answer here explaining my approach, methodology, and reasoning for this scenario-based question.`
      }));

      const response = await axios.post(`${API_BASE_URL}/assessment/response/bulk`, {
        assessmentId: this.assessmentId,
        responses: responses
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.data.success) {
        console.log('✅ Responses submitted successfully');
        return true;
      } else {
        console.error('❌ Failed to submit responses:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Submit responses error:', error.message);
      return false;
    }
  }

  async continueToNextAssessment() {
    console.log('⏭️ Continuing to next assessment...');
    try {
      const response = await axios.post(`${API_BASE_URL}/assessment/session/${this.sessionId}/next`, {}, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.data.success) {
        if (response.data.data.completed) {
          console.log('✅ All assessments completed!');
          return { completed: true };
        } else {
          console.log('✅ Moved to next assessment');
          this.assessmentId = response.data.data.assessment.id;
          return response.data.data;
        }
      } else {
        console.error('❌ Failed to continue:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Continue error:', error.message);
      return null;
    }
  }

  async getAssessmentResults() {
    console.log('📊 Getting assessment results...');
    try {
      const response = await axios.get(`${API_BASE_URL}/assessment/results/${this.assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.data.success) {
        console.log('✅ Assessment results retrieved');
        console.log('📈 Results:', {
          finalScore: response.data.data.finalScore,
          scoreLabel: response.data.data.scoreLabel,
          stars: response.data.data.stars,
          timeSpent: response.data.data.timeSpent
        });
        return response.data.data;
      } else {
        console.error('❌ Failed to get results:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Get results error:', error.message);
      return null;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting Assessment System Test');
    console.log('=====================================');

    // Step 1: Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.error('❌ Test failed at login step');
      return false;
    }

    // Step 2: Start assessment session
    const sessionData = await this.startAssessmentSession();
    if (!sessionData) {
      console.error('❌ Test failed at session start step');
      return false;
    }

    // Step 3: Test multiple assessments
    let assessmentCount = 0;
    const maxAssessments = 3; // Limit to prevent infinite loop

    while (assessmentCount < maxAssessments) {
      assessmentCount++;
      console.log(`\n📝 Assessment ${assessmentCount}:`);
      
      // Get current assessment
      const currentAssessment = await this.getCurrentAssessment();
      if (!currentAssessment) {
        console.error(`❌ Failed to get assessment ${assessmentCount}`);
        break;
      }

      // Submit responses
      const submitSuccess = await this.submitResponses();
      if (!submitSuccess) {
        console.error(`❌ Failed to submit responses for assessment ${assessmentCount}`);
        break;
      }

      // Get results
      const results = await this.getAssessmentResults();
      if (results) {
        console.log(`✅ Assessment ${assessmentCount} completed with score: ${results.finalScore}/10`);
      }

      // Continue to next assessment
      const nextResult = await this.continueToNextAssessment();
      if (!nextResult) {
        console.error(`❌ Failed to continue to next assessment`);
        break;
      }

      if (nextResult.completed) {
        console.log('🎉 All assessments completed successfully!');
        break;
      }
    }

    console.log('\n=====================================');
    console.log('✅ Assessment System Test Completed');
    return true;
  }
}

// Run the test
async function runTest() {
  const tester = new AssessmentTester();
  try {
    await tester.runFullTest();
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
  }
}

// Export for use in other files
module.exports = { AssessmentTester, runTest };

// Run if this file is executed directly
if (require.main === module) {
  runTest();
}
