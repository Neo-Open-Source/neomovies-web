import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'

export const Terms = () => {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ru' | 'en'>('ru')

  const handleLanguageChange = (_event: React.MouseEvent<HTMLElement>, newLang: 'ru' | 'en') => {
    if (newLang !== null) {
      setLang(newLang)
    }
  }

  const handleAccept = () => {
    localStorage.setItem('acceptedTerms', 'true')
    navigate('/')
  }

  const handleDecline = () => {
    localStorage.setItem('acceptedTerms', 'false')
    alert(
      lang === 'ru'
        ? 'Вы не можете использовать сайт без согласия с условиями.'
        : 'You cannot use the site without agreeing to the terms.'
    )
  }

  const content = {
    ru: {
      title: 'Пользовательское соглашение NeoMovies',
      subtitle: 'Пожалуйста, внимательно ознакомьтесь с условиями использования',
      selectLanguage: 'Выберите язык',
      accept: 'Принимаю условия',
      decline: 'Отклонить',
      footer: '© 2025 NeoMovies. Все права защищены.',
      sections: [
        {
          title: '1. Общие положения',
          text: 'Использование сайта NeoMovies возможно только при полном согласии с условиями настоящего Пользовательского соглашения. Несогласие с любыми положениями соглашения означает, что вы не имеете права использовать данный сайт и должны прекратить доступ к нему.',
        },
        {
          title: '2. Описание сервиса',
          text: 'NeoMovies предоставляет доступ к информации о фильмах и сериалах. Видео воспроизводятся с использованием сторонних видеохостингов и балансеров. Сайт не хранит и не распространяет видеофайлы. Мы выступаем исключительно в роли посредника между пользователем и внешними сервисами.\n\nНекоторая информация о доступности контента также может быть получена из общедоступных децентрализованных источников. Сайт не распространяет файлы и не является участником пиринговых сетей.',
        },
        {
          title: '3. Ответственность',
          text: 'Сайт не несёт ответственности за:',
          list: [
            'точность или легальность предоставленного сторонними плеерами контента;',
            'возможные нарушения авторских прав со стороны балансеров;',
            'действия пользователей, связанные с просмотром, загрузкой или распространением контента.',
          ],
          afterList: 'Вся ответственность за использование контента лежит исключительно на пользователе. Использование сторонних источников осуществляется на ваш собственный риск.',
        },
        {
          title: '4. Регистрация и персональные данные',
          text: 'Сайт собирает только минимальный набор данных: имя, email и пароль — исключительно для сохранения избранного. Пароли шифруются и хранятся безопасно. Мы не передаём ваши данные третьим лицам и не используем их в маркетинговых целях.\n\nИсходный код сайта полностью открыт и доступен для проверки в публичном репозитории, что обеспечивает максимальную прозрачность и возможность независимого аудита безопасности и обработки данных.\n\nПользователь подтверждает, что ему исполнилось 16 лет либо он получил разрешение от законного представителя.',
        },
        {
          title: '5. Изменения в соглашении',
          text: 'Мы оставляем за собой право вносить изменения в настоящее соглашение. Продолжение использования сервиса после внесения изменений означает ваше согласие с обновлёнными условиями.',
        },
        {
          title: '6. Заключительные положения',
          text: 'Настоящее соглашение вступает в силу с момента вашего согласия с его условиями и действует бессрочно.\n\nЕсли вы не согласны с какими-либо положениями данного соглашения, вы должны немедленно прекратить использование сервиса.',
        },
      ],
    },
    en: {
      title: 'NeoMovies Terms of Service',
      subtitle: 'Please read the terms of use carefully',
      selectLanguage: 'Select Language',
      accept: 'Accept Terms',
      decline: 'Decline',
      footer: '© 2025 NeoMovies. All rights reserved.',
      sections: [
        {
          title: '1. General Provisions',
          text: 'Use of the NeoMovies website is only possible with full agreement to the terms of this User Agreement. Disagreement with any provisions of the agreement means that you do not have the right to use this site and must stop accessing it.',
        },
        {
          title: '2. Service Description',
          text: 'NeoMovies provides access to information about movies and TV shows. Videos are played using third-party video hosting services and load balancers. The site does not store or distribute video files. We act exclusively as an intermediary between the user and external services.\n\nSome information about content availability may also be obtained from publicly available decentralized sources. The site does not distribute files and is not a participant in peer-to-peer networks.',
        },
        {
          title: '3. Liability',
          text: 'The site is not responsible for:',
          list: [
            'the accuracy or legality of content provided by third-party players;',
            'possible copyright violations by load balancers;',
            'user actions related to viewing, downloading, or distributing content.',
          ],
          afterList: 'All responsibility for using the content lies solely with the user. Use of third-party sources is at your own risk.',
        },
        {
          title: '4. Registration and Personal Data',
          text: 'The site collects only a minimal set of data: name, email, and password — exclusively for saving favorites. Passwords are encrypted and stored securely. We do not share your data with third parties and do not use it for marketing purposes.\n\nThe site\'s source code is fully open and available for review in a public repository, ensuring maximum transparency and the ability for independent security and data processing audits.\n\nThe user confirms that they are at least 16 years old or have received permission from a legal guardian.',
        },
        {
          title: '5. Changes to the Agreement',
          text: 'We reserve the right to make changes to this agreement. Continued use of the service after changes are made means your acceptance of the updated terms.',
        },
        {
          title: '6. Final Provisions',
          text: 'This agreement comes into effect from the moment you agree to its terms and is valid indefinitely.\n\nIf you do not agree with any provisions of this agreement, you must immediately stop using the service.',
        },
      ],
    },
  }

  const t = content[lang]

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#121212', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, backgroundColor: '#1e1e1e', color: '#fff' }}>
          {/* Language Selector */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <LanguageIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">{t.selectLanguage}</Typography>
          </Box>

          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={lang}
              exclusive
              onChange={handleLanguageChange}
              aria-label="language"
            >
              <ToggleButton value="ru" aria-label="russian">
                Русский
              </ToggleButton>
              <ToggleButton value="en" aria-label="english">
                English
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t.title}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {t.subtitle}
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ mb: 4, lineHeight: 1.8 }}>
            {t.sections.map((section, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1, color: '#fff' }}>
                  {section.title}
                </Typography>
                {section.text.split('\n\n').map((paragraph, pIndex) => (
                  <Typography key={pIndex} variant="body2" sx={{ mb: 1, color: '#ccc' }}>
                    {paragraph}
                  </Typography>
                ))}
                {section.list && (
                  <>
                    <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                      {section.list.map((item, liIndex) => (
                        <Typography key={liIndex} component="li" variant="body2" sx={{ mb: 0.5, color: '#ccc' }}>
                          {item}
                        </Typography>
                      ))}
                    </Box>
                    {section.afterList && (
                      <Typography variant="body2" sx={{ mb: 1, color: '#ccc' }}>
                        {section.afterList}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 4, borderColor: '#333' }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleDecline} sx={{ color: '#ccc', borderColor: '#555' }}>
              {t.decline}
            </Button>
            <Button variant="contained" color="primary" onClick={handleAccept}>
              {t.accept}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center', borderTop: '1px solid #333', pt: 2 }}>
            <Typography variant="caption" sx={{ color: '#999' }}>
              {t.footer}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
