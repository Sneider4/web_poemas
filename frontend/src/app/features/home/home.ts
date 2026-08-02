import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fondoDePoema, urlDeImagen } from '../../core/data/imagenes';
import { AuthorService } from '../../core/services/author.service';
import { CommunityService } from '../../core/services/community.service';
import { PoemsService } from '../../core/services/poems.service';
import { SeoService } from '../../core/services/seo.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PoemCard } from '../../shared/components/poem-card/poem-card';
import { Reveal } from '../../shared/directives/reveal';
import { aTextoPlano } from '../../shared/utils/texto-plano';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PoemCard, EmptyState, Reveal],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly poemsService = inject(PoemsService);
  private readonly authorService = inject(AuthorService);
  private readonly communityService = inject(CommunityService);
  private readonly seo = inject(SeoService);

  protected readonly destacados = this.poemsService.destacados;
  protected readonly autor = this.authorService.autor;
  protected readonly publicaciones = this.communityService.publicaciones;

  /**
   * Fondo del hero: la imagen que subio Santiago desde el panel. Si todavia
   * no hay ninguna, cae al degradado del poema destacado para que la portada
   * nunca se vea vacia.
   */
  protected readonly fondoHero = computed(() => {
    const propia = this.autor()?.heroImage?.trim();

    if (propia) {
      return `url('${urlDeImagen(propia)}')`;
    }

    const primero = this.destacados()[0];
    return fondoDePoema('', primero?.slug ?? 'santiago');
  });

  // --- Textos de la portada ---
  // Los edita Santiago desde el panel; si estan vacios se usan los valores
  // de respaldo para que la portada nunca quede en blanco.

  protected readonly antetitulo = computed(
    () => this.autor()?.heroEyebrow?.trim() || 'Santiago a secas',
  );

  protected readonly manifiesto = computed(
    () =>
      this.autor()?.manifesto?.trim() ||
      'Que se exprese lo que se vive, y que se muera lo insufrible.',
  );

  protected readonly notaManifiesto = computed(() => this.autor()?.manifestoNote?.trim() ?? '');

  /**
   * Verso grande del hero.
   *
   * Si Santiago escribio uno propio en el panel, manda ese. Si no, se toman
   * los primeros versos del poema destacado, descartando las lineas muy
   * cortas: varios poemas usan marcas de tiempo ("8 pm", "12 am") que como
   * titular no dicen nada, y el verso siguiente si tiene fuerza.
   */
  protected readonly versoDestacado = computed(() => {
    const propio = this.autor()?.heroVerse?.trim();

    if (propio) {
      return propio;
    }

    const poema = this.destacados()[0];

    if (!poema) {
      return 'Poemas de un solitario para otro solitario';
    }

    // Texto plano: el hero lo muestra en letra enorme y el formato de un
    // verso suelto, sacado de contexto, no aporta ahí.
    const versos = aTextoPlano(poema.body)
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 14);

    return versos.slice(0, 2).join('\n') || poema.title;
  });

  /**
   * Poema al que pertenece el verso del hero. Se oculta si Santiago
   * escribio un texto propio, porque entonces no viene de ningun poema.
   */
  protected readonly poemaDestacado = computed(() => {
    if (this.autor()?.heroVerse?.trim()) {
      return null;
    }

    return this.destacados()[0] ?? null;
  });

  /** Solo las tres publicaciones mas recientes para la vista previa. */
  protected readonly ultimasPublicaciones = computed(() => this.publicaciones().slice(0, 3));

  ngOnInit(): void {
    void this.poemsService.cargarDestacados(3);
    void this.communityService.cargar();

    this.seo.aplicarInicio(
      'Poemas de un solitario para otro solitario. Escritos de Santiago, un intento de escritor, a veces de persona.',
    );

    // El layout público ya suele haberlo cargado, pero la portada depende
    // de estos textos: si se entra directo acá, no puede quedar sin ellos.
    if (!this.authorService.autor()) {
      void this.authorService.cargar();
    }
  }
}
