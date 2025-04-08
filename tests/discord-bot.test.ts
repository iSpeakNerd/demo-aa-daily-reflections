import {
  handler,
  postToDiscordWebhooks,
} from '../functions/discord-webhook.ts';
import { getFormattedReflection } from '../utils/external-reflections.ts';
import { type DiscordEmbed } from '../_types/discord.types.ts';
import dotenv from 'dotenv';
import { wrapErrorWithContext, ErrorType } from '../utils/errors.ts';

// Create mock verification function
const mockVerifyRequest = async (event: any) => {
  // Bypass the actual verification
  const message = JSON.parse(event.body);
  return {
    isValid: true,
    message,
  };
};

dotenv.config();

async function testReflectionsCommand() {
  console.log('🧪 Starting Reflections Command Test Suite');

  // 1. Test getFormattedReflection independently
  try {
    console.log('\n📝 Testing getFormattedReflection...');
    const reflection = await getFormattedReflection();
    if (reflection) {
      console.log('✅ getFormattedReflection returned valid embed:');
      console.log('Title:', reflection.title);
      console.log(
        'Description preview:',
        reflection.description?.slice(0, 100) + '...'
      );
    } else {
      console.log('⚠️ getFormattedReflection returned null');
    }
  } catch (error) {
    console.error('❌ getFormattedReflection failed:', error);
  }

  // 2. Create a mock Discord interaction request
  const mockBody = {
    type: 2,
    data: {
      name: 'reflections',
    },
    id: 'mock-interaction-id',
    application_id: process.env.DISCORD_CLIENT_ID,
    token: 'mock-token',
  };

  const mockEvent = {
    body: JSON.stringify(mockBody),
    headers: {
      'x-signature-ed25519': 'mock-signature',
      'x-signature-timestamp': Date.now().toString(),
    },
  };

  // 3. Test the full flow using our mock verification
  try {
    console.log('\n🔄 Testing full handler flow...');
    const mockEvent = {
      body: JSON.stringify(mockBody),
      headers: {
        'x-signature-ed25519': 'mock-signature',
        'x-signature-timestamp': Date.now().toString(),
      },
    };

    console.log('Sending mock request:', JSON.stringify(mockBody, null, 2));

    // Verify and parse the request
    const { isValid, message } = await mockVerifyRequest(mockEvent);

    if (!isValid) {
      throw wrapErrorWithContext(new Error('Mock verification failed'));
    }

    // Process the command directly
    if (message.type === 2 && message.data.name === 'reflections') {
      const reflection = await getFormattedReflection();
      if (reflection) {
        console.log('✅ Reflection processed successfully');
        console.log('Reflection content:', reflection);
      } else {
        console.log('⚠️ No reflection returned');
      }
    }
  } catch (error) {
    console.error('❌ Command processing failed:', error);
  }

  // 4. Test webhook posting
  try {
    console.log('\n📤 Testing webhook posting...');
    const mockEmbed: DiscordEmbed = {
      title: 'Test Reflection',
      description: 'This is a test reflection',
      color: 0x0099ff,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending test embed:', JSON.stringify(mockEmbed, null, 2));
    const webhookResult = await postToDiscordWebhooks(mockEmbed);
    console.log('✅ Webhook posting results:', webhookResult);
  } catch (error) {
    console.error('❌ Webhook posting failed:', error);
  }
}

async function testEndpointDirectly() {
  const endpoint =
    'https://heartfelt-truffle-708a6d.netlify.app/.netlify/functions/discord-bot';

  console.log('🌐 Testing endpoint connectivity...');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Discord requires these headers for verification
        'X-Signature-Ed25519': 'test-signature',
        'X-Signature-Timestamp': Date.now().toString(),
      },
      body: JSON.stringify({
        type: 1, // Ping type
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('❌ Endpoint test failed:', error);
  }
}

// Run the tests
console.log('🚀 Starting Discord Bot Tests\n');
Promise.all([testEndpointDirectly(), testReflectionsCommand()])
  .then(() => console.log('\n✨ All tests completed'))
  .catch((error) => console.error('\n💥 Test suite failed:', error));
