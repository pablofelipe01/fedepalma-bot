import { migrateJsonData, verifyMigration } from '../src/lib/migrate-data.js'

async function runMigration() {
  console.log('🚀 Iniciando migración de datos a Supabase...')
  
  try {
    const success = await migrateJsonData()
    
    if (success) {
      console.log('✅ Migración completada. Verificando...')
      await verifyMigration()
    } else {
      console.log('❌ Error en la migración')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error)
    process.exit(1)
  }
}

runMigration()