import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { generateSession, GENERATOR_VERSION } from '@/lib/generator';
import type { GeneratorConfig, Level, OperationType, NumberType } from '@/lib/generator';

const ALL_OPERATIONS: OperationType[] = ['add', 'sub', 'mul', 'div'];
const ALL_NUMBER_TYPES: NumberType[] = ['integer', 'decimal', 'fraction'];
const ALL_LEVELS: Level[] = [1, 2, 3, 4, 5];

const TEST_PRESETS: Record<string, {
  questionCount: number;
  timerDurationSeconds: number;
  levels: Level[];
  operations: OperationType[];
  numberTypes: NumberType[];
}> = {
  optiver_80_in_8: {
    questionCount: 80,
    timerDurationSeconds: 480,
    levels: ALL_LEVELS,
    operations: ALL_OPERATIONS,
    numberTypes: ALL_NUMBER_TYPES,
  },
  mixed_sprint_20: {
    questionCount: 20,
    timerDurationSeconds: 120,
    levels: ALL_LEVELS,
    operations: ALL_OPERATIONS,
    numberTypes: ALL_NUMBER_TYPES,
  },
  mixed_sprint_40: {
    questionCount: 40,
    timerDurationSeconds: 240,
    levels: ALL_LEVELS,
    operations: ALL_OPERATIONS,
    numberTypes: ALL_NUMBER_TYPES,
  },
  fractions_decimals: {
    questionCount: 30,
    timerDurationSeconds: 300,
    levels: [3, 4, 5],
    operations: ALL_OPERATIONS,
    numberTypes: ['decimal', 'fraction'],
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, presetName, config: rawConfig } = body;

    if (!mode || !['practice', 'test'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode. Must be "practice" or "test".' }, { status: 400 });
    }

    let generatorConfig: GeneratorConfig;
    let timerDurationSeconds: number | null = null;
    let timerEnabled = false;

    if (mode === 'test') {
      if (!presetName || !TEST_PRESETS[presetName]) {
        return NextResponse.json(
          { error: `Invalid preset. Available: ${Object.keys(TEST_PRESETS).join(', ')}` },
          { status: 400 }
        );
      }
      const preset = TEST_PRESETS[presetName];
      generatorConfig = {
        levels: preset.levels,
        operations: preset.operations,
        numberTypes: preset.numberTypes,
        questionCount: preset.questionCount,
      };
      timerEnabled = true;
      timerDurationSeconds = preset.timerDurationSeconds;
    } else {
      // Practice mode
      if (!rawConfig) {
        return NextResponse.json({ error: 'Config required for practice mode.' }, { status: 400 });
      }
      generatorConfig = {
        levels: rawConfig.levels || ALL_LEVELS,
        operations: rawConfig.operations || ALL_OPERATIONS,
        numberTypes: rawConfig.numberTypes || ALL_NUMBER_TYPES,
        questionCount: rawConfig.questionCount || 20,
      };
      timerEnabled = rawConfig.timerEnabled ?? false;
      timerDurationSeconds = timerEnabled ? (rawConfig.timerDurationSeconds ?? null) : null;
    }

    const seed = crypto.randomUUID();
    const { questions } = generateSession(generatorConfig, seed);

    const isFinite = mode === 'test' || (rawConfig?.sessionType !== 'open-ended');

    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        mode,
        preset_name: presetName ?? null,
        seed,
        generator_version: GENERATOR_VERSION,
        config: rawConfig ?? null,
        selected_levels: generatorConfig.levels,
        operation_filters: generatorConfig.operations,
        number_type_filters: generatorConfig.numberTypes,
        is_finite: isFinite,
        question_count_target: generatorConfig.questionCount,
        timer_enabled: timerEnabled,
        timer_duration_seconds: timerDurationSeconds,
        current_question_index: 0,
        status: 'active',
      })
      .select('id')
      .single();

    if (sessionError) {
      return NextResponse.json({ error: 'Failed to create session', details: sessionError.message }, { status: 500 });
    }

    // Insert question instances
    const questionRows = questions.map((q, i) => ({
      session_id: session.id,
      order_index: i,
      prompt: q.prompt,
      correct_answer: q.correctAnswer,
      level: q.level,
      operation_type: q.operationType,
      number_type: q.numberType,
      variable_position: q.variablePosition,
      target_time_seconds: q.targetTimeSeconds,
      skipped: false,
      is_correct: null,
      user_answer: null,
      response_time_ms: null,
      answered_at: null,
    }));

    const { error: questionsError } = await supabase
      .from('question_instances')
      .insert(questionRows);

    if (questionsError) {
      return NextResponse.json({ error: 'Failed to create questions', details: questionsError.message }, { status: 500 });
    }

    const firstQuestion = questions[0];
    return NextResponse.json({
      sessionId: session.id,
      totalQuestions: questions.length,
      firstQuestion: {
        prompt: firstQuestion.prompt,
        orderIndex: 0,
        targetTimeSeconds: firstQuestion.targetTimeSeconds,
      },
      timerDurationSeconds,
      mode,
    });
  } catch (err) {
    console.error('POST /api/sessions error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
