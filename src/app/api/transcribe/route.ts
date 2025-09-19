import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data with audio file' }, { status: 400 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log(`🎤 Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`)

    // Validar archivo de audio - ser más flexible con los tipos
    const validAudioTypes = [
      'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 
      'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/aac'
    ]
    
    const isValidAudio = audioFile.type.startsWith('audio/') || 
                        validAudioTypes.some(type => audioFile.type.includes(type)) ||
                        audioFile.name.match(/\.(wav|mp3|mp4|m4a|webm|ogg|aac)$/i)

    if (!isValidAudio) {
      console.error(`❌ Invalid file type: ${audioFile.type}`)
      return NextResponse.json({ 
        error: `Invalid file type: ${audioFile.type}. Expected audio file.` 
      }, { status: 400 })
    }

    // Verificar tamaño del archivo (máximo 25MB para Deepgram)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Audio file too large. Maximum size is 25MB.' 
      }, { status: 400 })
    }

    if (audioFile.size === 0) {
      return NextResponse.json({ 
        error: 'Audio file is empty.' 
      }, { status: 400 })
    }

    // Convert File to Buffer
    const audioBuffer = await audioFile.arrayBuffer()
    console.log(`📊 Audio buffer size: ${audioBuffer.byteLength} bytes`)
    
    // Determinar el Content-Type para Deepgram
    let deepgramContentType = audioFile.type
    if (!deepgramContentType || deepgramContentType === 'application/octet-stream') {
      // Fallback basado en la extensión del archivo
      if (audioFile.name.endsWith('.mp4') || audioFile.name.endsWith('.m4a')) {
        deepgramContentType = 'audio/mp4'
      } else if (audioFile.name.endsWith('.webm')) {
        deepgramContentType = 'audio/webm'
      } else {
        deepgramContentType = 'audio/wav'
      }
    }
    
    console.log(`🎵 Sending to Deepgram with Content-Type: ${deepgramContentType}`)
    
    // Call Deepgram API with better error handling
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': deepgramContentType
      },
      body: audioBuffer
    })

    if (!response.ok) {
      console.error('Deepgram API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Deepgram error details:', errorText)
      return NextResponse.json({ error: 'Transcription service failed' }, { status: 500 })
    }

    const result = await response.json()
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    
    console.log(`✅ Transcription successful: "${transcript}"`)
    
    return NextResponse.json({ transcript })
    
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}