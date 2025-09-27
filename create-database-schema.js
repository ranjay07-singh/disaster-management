const { Client } = require('pg');

// Use the same connection details from your test-db-connection.js
const client = new Client({
  host: 'disaster-management-db.cs94o2m02li7.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'disaster_management',
  user: 'dbadmin',
  password: 'DisasterDB2024!',
  ssl: {
    rejectUnauthorized: false
  }
});

const createSchema = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📊 Creating database schema...');

    // Drop existing tables if they exist (for clean setup)
    console.log('🗑️  Dropping existing tables if they exist...');
    await client.query('DROP TABLE IF EXISTS system_analytics CASCADE');
    await client.query('DROP TABLE IF EXISTS notifications CASCADE');
    await client.query('DROP TABLE IF EXISTS case_assignments CASCADE');
    await client.query('DROP TABLE IF EXISTS volunteer_availability CASCADE');
    await client.query('DROP TABLE IF EXISTS emergency_cases CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    // Create Users table with role-based access
    console.log('👥 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) CHECK (role IN ('victim', 'volunteer', 'monitoring')),
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        profile_image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Emergency cases table
    console.log('🚨 Creating emergency_cases table...');
    await client.query(`
      CREATE TABLE emergency_cases (
        id SERIAL PRIMARY KEY,
        victim_id INTEGER REFERENCES users(id),
        assigned_volunteer_id INTEGER REFERENCES users(id),
        case_type VARCHAR(50) NOT NULL,
        description TEXT,
        severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
        location_lat DECIMAL(10, 8) NOT NULL,
        location_lng DECIMAL(11, 8) NOT NULL,
        location_address TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled')),
        audio_recording_url TEXT,
        images_urls TEXT[],
        ai_analysis_result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);

    // Create Volunteer availability table
    console.log('🚑 Creating volunteer_availability table...');
    await client.query(`
      CREATE TABLE volunteer_availability (
        id SERIAL PRIMARY KEY,
        volunteer_id INTEGER REFERENCES users(id),
        is_available BOOLEAN DEFAULT true,
        current_lat DECIMAL(10, 8),
        current_lng DECIMAL(11, 8),
        last_location_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expertise_areas TEXT[],
        max_distance_km INTEGER DEFAULT 50
      )
    `);

    // Create Case assignments table
    console.log('📋 Creating case_assignments table...');
    await client.query(`
      CREATE TABLE case_assignments (
        id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES emergency_cases(id),
        volunteer_id INTEGER REFERENCES users(id),
        assignment_method VARCHAR(20) DEFAULT 'auto',
        distance_km DECIMAL(8, 2),
        estimated_arrival_time INTERVAL,
        status VARCHAR(20) DEFAULT 'assigned',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Create Notifications table
    console.log('🔔 Creating notifications table...');
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        case_id INTEGER REFERENCES emergency_cases(id),
        type VARCHAR(30) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivery_status VARCHAR(20) DEFAULT 'pending'
      )
    `);

    // Create System analytics table
    console.log('📈 Creating system_analytics table...');
    await client.query(`
      CREATE TABLE system_analytics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total_cases INTEGER DEFAULT 0,
        resolved_cases INTEGER DEFAULT 0,
        pending_cases INTEGER DEFAULT 0,
        active_volunteers INTEGER DEFAULT 0,
        response_time_avg INTERVAL,
        user_registrations INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    console.log('🚀 Creating indexes for better performance...');
    await client.query('CREATE INDEX idx_users_role ON users(role)');
    await client.query('CREATE INDEX idx_users_firebase_uid ON users(firebase_uid)');
    await client.query('CREATE INDEX idx_emergency_cases_status ON emergency_cases(status)');
    await client.query('CREATE INDEX idx_emergency_cases_victim ON emergency_cases(victim_id)');
    await client.query('CREATE INDEX idx_emergency_cases_location ON emergency_cases(location_lat, location_lng)');
    await client.query('CREATE INDEX idx_volunteer_availability_location ON volunteer_availability(current_lat, current_lng)');
    await client.query('CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read)');

    // Insert sample data for testing
    console.log('📝 Inserting sample data...');
    
    // Sample users
    await client.query(`
      INSERT INTO users (firebase_uid, email, name, phone, role, location_lat, location_lng, is_active) VALUES
      ('firebase_admin_001', 'admin@disastermanagement.com', 'System Administrator', '+1234567890', 'monitoring', 40.7128, -74.0060, true),
      ('firebase_vol_001', 'volunteer1@example.com', 'John Volunteer', '+1234567891', 'volunteer', 40.7589, -73.9851, true),
      ('firebase_vol_002', 'volunteer2@example.com', 'Sarah Helper', '+1234567892', 'volunteer', 40.6892, -74.0445, true),
      ('firebase_victim_001', 'victim1@example.com', 'Emergency User', '+1234567893', 'victim', 40.7505, -73.9934, true)
    `);

    // Sample emergency cases
    await client.query(`
      INSERT INTO emergency_cases (victim_id, case_type, description, severity_level, location_lat, location_lng, location_address, status) VALUES
      (4, 'medical', 'Person injured in car accident', 4, 40.7505, -73.9934, 'Times Square, New York, NY', 'pending'),
      (4, 'fire', 'Small kitchen fire reported', 3, 40.7589, -73.9851, 'Central Park, New York, NY', 'resolved')
    `);

    // Sample volunteer availability
    await client.query(`
      INSERT INTO volunteer_availability (volunteer_id, is_available, current_lat, current_lng, expertise_areas, max_distance_km) VALUES
      (2, true, 40.7589, -73.9851, ARRAY['medical', 'rescue'], 25),
      (3, true, 40.6892, -74.0445, ARRAY['fire', 'evacuation'], 30)
    `);

    // Sample system analytics
    await client.query(`
      INSERT INTO system_analytics (date, total_cases, resolved_cases, pending_cases, active_volunteers, user_registrations) VALUES
      (CURRENT_DATE, 2, 1, 1, 2, 4)
    `);

    console.log('✅ Database schema created successfully!');
    console.log('📊 Sample data inserted!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    await client.end();
    console.log('🔒 Database connection closed');
    console.log('🎉 Schema setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    process.exit(1);
  }
};

createSchema();