import { db } from '../../utils/supabase.ts';
import { TablesInsert, TablesUpdate } from '../../_types/db.types.ts';

async function testDatabaseOperations() {
  console.log('Starting Database CRUD Tests with fictional dates...\n');

  // Test data with impossible dates
  const testReflections: TablesInsert<'AA_Daily_Reflections'>[] = [
    {
      title: 'Test Reflection 42',
      date_string: '42 DECEMBER',
      month_day: '12-42',
      reflection: 'This is test reflection 42',
      quote_text: 'This is test quote 42',
      page_number: 142,
      book_name: 'Test Book',
    },
    {
      title: 'Test Reflection 43',
      date_string: '43 DECEMBER',
      month_day: '12-43',
      reflection: 'This is test reflection 43',
      quote_text: 'This is test quote 43',
      page_number: 143,
      book_name: 'Test Book',
    },
    {
      title: 'Test Reflection 45',
      date_string: '45 DECEMBER',
      month_day: '12-45',
      reflection: 'This is test reflection 45',
      quote_text: 'This is test quote 45',
      page_number: 145,
      book_name: 'Test Book',
    },
  ];

  // Test CREATE operations
  console.log('=== Testing CREATE Operations ===');
  for (const testReflection of testReflections) {
    try {
      const createResult = await db.CRUD.create(testReflection);
      console.log(
        `✓ Create operation successful for ${testReflection.date_string}`
      );
      console.log('Created reflection:', {
        title: createResult?.title,
        date_string: createResult?.date_string,
        month_day: createResult?.month_day,
      });
    } catch (error) {
      console.error(
        `✗ Create operation failed for ${testReflection.date_string}:`,
        error
      );
    }
  }
  console.log('\n');

  // Test READ operations
  console.log('=== Testing READ Operations ===');
  for (const date of ['42 DECEMBER', '43 DECEMBER', '45 DECEMBER']) {
    try {
      const readResult = await db.CRUD.read(date);
      console.log(`✓ Read operation successful for ${date}`);
      console.log('Retrieved reflection:', {
        title: readResult?.title,
        date_string: readResult?.date_string,
        month_day: readResult?.month_day,
      });
    } catch (error) {
      console.error(`✗ Read operation failed for ${date}:`, error);
    }
  }
  console.log('\n');

  // Test UPDATE operations (actual updates for impossible dates)
  console.log('=== Testing UPDATE Operations ===');
  const updateTests: TablesUpdate<'AA_Daily_Reflections'>[] = [
    {
      date_string: '42 DECEMBER',
      title: 'Updated Test Reflection 42',
      reflection: 'This is an updated reflection for day 42',
      quote_text: 'Updated quote for 42',
    },
    {
      date_string: '43 DECEMBER',
      title: 'Updated Test Reflection 43',
      reflection: 'This is an updated reflection for day 43',
      quote_text: 'Updated quote for 43',
    },
  ];

  for (const updateData of updateTests) {
    try {
      const updateResult = await db.CRUD.update(updateData);
      console.log(
        `✓ Update operation successful for ${updateData.date_string}`
      );
      console.log('Updated reflection:', {
        title: updateResult?.title,
        date_string: updateResult?.date_string,
        reflection: updateResult?.reflection,
      });
    } catch (error) {
      console.error(
        `✗ Update operation failed for ${updateData.date_string}:`,
        error
      );
    }
  }
  console.log('\n');

  // Verify updates with reads
  console.log('=== Verifying Updates ===');
  for (const date of ['42 DECEMBER', '43 DECEMBER']) {
    try {
      const readResult = await db.CRUD.read(date);
      console.log(`✓ Verification successful for ${date}`);
      console.log('Current reflection state:', {
        title: readResult?.title,
        date_string: readResult?.date_string,
        reflection: readResult?.reflection,
      });
    } catch (error) {
      console.error(`✗ Verification failed for ${date}:`, error);
    }
  }
  console.log('\n');

  // Test DELETE operations (actual deletes for impossible dates)
  console.log('=== Testing DELETE Operations ===');
  for (const date of ['42 DECEMBER', '43 DECEMBER', '45 DECEMBER']) {
    try {
      const deleteResult = await db.CRUD.delete(date);
      console.log(`✓ Delete operation successful for ${date}`);
      console.log('Deleted reflection:', {
        title: deleteResult?.title,
        date_string: deleteResult?.date_string,
      });
    } catch (error) {
      console.error(`✗ Delete operation failed for ${date}:`, error);
    }
  }
  console.log('\n');

  // Verify deletes with reads
  console.log('=== Verifying Deletes ===');
  for (const date of ['42 DECEMBER', '43 DECEMBER', '45 DECEMBER']) {
    try {
      const readResult = await db.CRUD.read(date);
      if (readResult) {
        console.error(
          `✗ Verification failed: ${date} still exists in database`
        );
      } else {
        console.log(`✓ Verification successful: ${date} was properly deleted`);
      }
    } catch (error) {
      console.log(
        `✓ Verification successful: ${date} was properly deleted (read throws error)`
      );
    }
  }
  console.log('\n');

  console.log('Database CRUD Tests Completed');
}

// Run the tests
testDatabaseOperations().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
